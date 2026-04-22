import type { FastifyInstance } from 'fastify';
import type { PlatformEvent } from '../plugins/event-bus.js';

/**
 * Maps platform events to push notifications.
 * Return null to suppress the notification.
 */
function toNotification(event: PlatformEvent) {
  switch (event.type) {
    case 'approval.submit':
      return {
        type: 'approval.pending',
        title: 'Approval Required',
        message: `${event.userName} submitted "${event.meta.title}" for your review`,
        entityId: event.entityId,
        target: 'supervisors',            // push to all supervisors
      };

    case 'approval.approved':
      return {
        type: 'approval.approved',
        title: 'Request Approved ✓',
        message: `${event.userName} approved "${event.meta.title}"`,
        entityId: event.entityId,
        target: 'submitter',              // push only to the original submitter
        submittedBy: event.meta.submittedBy as string | undefined,
      };

    case 'approval.rejected':
      return {
        type: 'approval.rejected',
        title: 'Request Rejected',
        message: `${event.userName} rejected "${event.meta.title}"${event.meta.reason ? `: ${event.meta.reason}` : ''}`,
        entityId: event.entityId,
        target: 'submitter',
        submittedBy: event.meta.submittedBy as string | undefined,
      };

    case 'flow.publish':
      return {
        type: 'flow.published',
        title: 'Flow Published',
        message: `${event.userName} published flow "${event.meta.name}"`,
        entityId: event.entityId,
        target: 'all',
      };

    case 'user.create':
      return {
        type: 'user.created',
        title: 'New User Added',
        message: `${event.userName} created user "${event.meta.username}"`,
        entityId: event.entityId,
        target: 'admins',
      };

    default:
      return null;   // no notification for this event type
  }
}

export function startNotificationWorker(fastify: FastifyInstance) {
  fastify.events.on('platform:event', async (event: PlatformEvent) => {
    const notif = toNotification(event);
    if (!notif) return;

    const payload = {
      type:      notif.type,
      title:     notif.title,
      message:   notif.message,
      entityId:  notif.entityId,
      timestamp: event.timestamp.toISOString(),
    };

    if (notif.target === 'all') {
      fastify.broadcast(payload);
      return;
    }

    if (notif.target === 'submitter' && notif.submittedBy) {
      fastify.pushNotification(notif.submittedBy, payload);
      return;
    }

    if (notif.target === 'supervisors' || notif.target === 'admins') {
      // Fetch users with the right role and push to each connected one
      try {
        const targetRoles = notif.target === 'supervisors'
          ? ['QA Supervisor', 'Manager', 'Org Admin']
          : ['Org Admin'];

        const allUsers = await fastify.kcAdmin.listUsers();
        await Promise.all(
          allUsers.map(async (user: any) => {
            const roles = await fastify.kcAdmin.getUserRealmRoles(user.id);
            const roleNames = roles.map((r: any) => r.name);
            const hasRole = targetRoles.some((r) => roleNames.includes(r));
            if (hasRole) fastify.pushNotification(user.id, payload);
          })
        );
      } catch (err) {
        fastify.log.error({ err }, 'notification worker: failed to resolve target users');
      }
      return;
    }
  });

  fastify.log.info('notification worker started');
}
