import type { FastifyInstance } from 'fastify';
import type { PlatformEvent } from '../plugins/event-bus.js';
import { resolveRule } from '../config/logger.config.js';

export function startLoggerWorker(fastify: FastifyInstance) {
  fastify.events.on('platform:event', async (event: PlatformEvent) => {
    const rule = resolveRule(event.type);

    if (!rule.log) {
      fastify.log.debug({ eventType: event.type }, 'logger: event dropped by config');
      return;
    }

    // Strip sensitive fields from meta before saving
    let meta = { ...event.meta };
    if (rule.stripMeta?.length) {
      for (const key of rule.stripMeta) {
        delete meta[key];
      }
    }

    try {
      await fastify.prisma.auditLog.create({
        data: {
          action:   event.type,
          entity:   event.entity,
          entityId: event.entityId ?? null,
          userId:   event.userId,
          userName: event.userName,
          meta,
          ip:       event.ip ?? null,
          createdAt: event.timestamp,
        },
      });
      fastify.log.debug({ eventType: event.type, userId: event.userId }, 'logger: event saved');
    } catch (err) {
      // Logger must never crash the server
      fastify.log.error({ err, eventType: event.type }, 'logger: failed to save event');
    }
  });

  fastify.log.info('logger worker started — listening for platform events');
}
