import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { Connection, Client } from '@temporalio/client';

declare module 'fastify' {
  interface FastifyInstance {
    temporal: Client;
  }
}

const temporalPlugin: FastifyPluginAsync = async (fastify) => {
  const address = process.env.TEMPORAL_ADDRESS ?? 'localhost:7233';
  const namespace = process.env.TEMPORAL_NAMESPACE ?? 'default';

  const connection = await Connection.connect({ address });
  const client = new Client({ connection, namespace });

  fastify.decorate('temporal', client);

  fastify.addHook('onClose', async () => {
    await connection.close();
  });

  fastify.log.info(`[Temporal] Connected to ${address} (namespace: ${namespace})`);
};

export default fp(temporalPlugin, { name: 'temporal' });
