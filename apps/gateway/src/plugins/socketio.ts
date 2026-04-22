import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { Server as SocketIOServer, type Socket } from 'socket.io';

declare module 'fastify' {
  interface FastifyInstance {
    io: SocketIOServer;
    pushToWorker: (workerId: string, event: object) => void;
    pushNotification: (userId: string, notification: PushNotification) => void;
    broadcast: (notification: PushNotification) => void;
  }
}

export interface PushNotification {
  type: string;           // 'approval.pending' | 'approval.decided' | 'flow.published' | ...
  title: string;
  message: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}

const socketioPlugin: FastifyPluginAsync = async (fastify) => {
  // userId → socket (one connection per user)
  const userSockets = new Map<string, Socket>();
  const workerSockets = new Map<string, Socket>();

  const io = new SocketIOServer(fastify.server, {
    cors: { origin: process.env.FRONTEND_URL ?? 'http://localhost:3000', credentials: true },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    const userId: string | undefined = socket.handshake.auth?.userId;
    const workerId: string | undefined = socket.handshake.auth?.workerId;

    if (userId) {
      userSockets.set(userId, socket);
      fastify.log.info(`[Socket.io] User connected: ${userId}`);
    }
    if (workerId) {
      workerSockets.set(workerId, socket);
      fastify.log.info(`[Socket.io] Worker connected: ${workerId}`);
    }

    socket.on('disconnect', () => {
      if (userId) {
        userSockets.delete(userId);
        fastify.log.info(`[Socket.io] User disconnected: ${userId}`);
      }
      if (workerId) {
        workerSockets.delete(workerId);
        fastify.log.info(`[Socket.io] Worker disconnected: ${workerId}`);
      }
    });

    // Forward worker:push events from the Form Worker service connection
    socket.on('worker:push', ({ workerId: targetId, event }: { workerId: string; event: object }) => {
      const target = workerSockets.get(targetId);
      if (target) target.emit('enb:event', event);
    });
  });

  fastify.decorate('io', io);

  fastify.decorate('pushToWorker', (workerId: string, event: object) => {
    const socket = workerSockets.get(workerId);
    if (socket) socket.emit('enb:event', event);
    else fastify.log.warn(`[Socket.io] Worker ${workerId} not connected — event dropped`);
  });

  fastify.decorate('pushNotification', (userId: string, notification: PushNotification) => {
    const socket = userSockets.get(userId);
    if (socket) socket.emit('notification', notification);
    else fastify.log.debug(`[Socket.io] User ${userId} offline — notification not delivered`);
  });

  fastify.decorate('broadcast', (notification: PushNotification) => {
    io.emit('notification', notification);
  });

  fastify.addHook('onClose', async () => { io.close(); });
};

export default fp(socketioPlugin, { name: 'socketio' });
