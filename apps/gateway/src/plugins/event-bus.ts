import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { EventEmitter } from 'node:events';

export interface PlatformEvent {
  type: string;           // e.g. "flow.publish", "approval.submit"
  entity: string;         // e.g. "flow", "approval"
  entityId?: string;
  userId: string;
  userName: string;
  ip?: string;
  meta: Record<string, unknown>;
  timestamp: Date;
}

declare module 'fastify' {
  interface FastifyInstance {
    events: EventEmitter;
    emit: (event: PlatformEvent) => void;
  }
}

const eventBusPlugin: FastifyPluginAsync = async (fastify) => {
  const bus = new EventEmitter();
  bus.setMaxListeners(50);

  fastify.decorate('events', bus);

  fastify.decorate('emit', (event: PlatformEvent) => {
    bus.emit('platform:event', event);
    fastify.log.debug({ eventType: event.type }, 'event emitted');
  });
};

export default fp(eventBusPlugin, { name: 'event-bus' });
