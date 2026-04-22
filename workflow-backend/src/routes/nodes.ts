import type { FastifyPluginAsync } from 'fastify';
import { NODE_DEFINITIONS } from '../data/nodes.data.js';

const nodesRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/nodes',
    { onRequest: [fastify.verifyJwt] },
    async (request, reply) => {
      const { NodeId } = request.query as { NodeId?: string };

      if (NodeId) {
        const node = NODE_DEFINITIONS.find((n) => n.Nodeid === NodeId);
        if (!node) {
          return reply.code(404).send({ error: `Node "${NodeId}" not found` });
        }
        return node;
      }

      const grouped: Record<string, typeof NODE_DEFINITIONS> = {};
      NODE_DEFINITIONS.forEach((node) => {
        if (!grouped[node.category]) grouped[node.category] = [];
        grouped[node.category].push(node);
      });

      const categories = Object.entries(grouped).map(([category, nodes]) => ({
        category,
        categoryLabel: nodes[0].categoryLabel,
        nodes,
      }));

      return { categories, total: NODE_DEFINITIONS.length };
    },
  );
};

export default nodesRoute;
