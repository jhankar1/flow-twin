import type { FastifyRequest, FastifyInstance } from 'fastify';
import type { PlatformEvent } from '../plugins/event-bus.js';

/**
 * Emit a platform event from a route handler.
 * The logger worker decides whether to persist it.
 */
export function emitEvent(
  fastify: FastifyInstance,
  request: FastifyRequest,
  type: string,
  entity: string,
  entityId?: string,
  meta: Record<string, unknown> = {},
) {
  const user = (request as any).user;
  if (!user) return;

  const userName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || user.id;

  const event: PlatformEvent = {
    type,
    entity,
    entityId,
    userId: user.id,
    userName,
    ip: request.ip,
    meta,
    timestamp: new Date(),
  };

  fastify.emit(event);
}
