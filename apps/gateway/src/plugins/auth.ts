import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';

export interface JwtUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtUser;
  }
  interface FastifyInstance {
    verifyJwt: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  const keycloakUrl = process.env.KEYCLOAK_URL ?? 'http://localhost:8080';
  const realm = process.env.KEYCLOAK_REALM ?? 'elb-platform';
  const clientId = process.env.KEYCLOAK_CLIENT_ID ?? 'workflow-backend';

  const jwksClient = jwksRsa({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`,
  });

  async function getSigningKey(kid: string): Promise<string> {
    const key = await jwksClient.getSigningKey(kid);
    return key.getPublicKey();
  }

  function extractToken(request: FastifyRequest): string | null {
    // 1. Bearer header (API clients / Postman)
    const header = request.headers.authorization;
    if (header?.startsWith('Bearer ')) return header.slice(7);

    // 2. httpOnly cookie (browser BFF flow)
    const cookie = (request.cookies as Record<string, string | undefined>)['access_token'];
    if (cookie) return cookie;

    return null;
  }

  fastify.decorate(
    'verifyJwt',
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const token = extractToken(request);
      if (!token) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      try {
        const decoded = jwt.decode(token, { complete: true });
        if (!decoded || typeof decoded === 'string' || !decoded.header.kid) {
          return reply.code(401).send({ error: 'Invalid token' });
        }
        const publicKey = await getSigningKey(decoded.header.kid);
        const payload = jwt.verify(token, publicKey, {
          algorithms: ['RS256'],
          issuer: `${keycloakUrl}/realms/${realm}`,
        }) as jwt.JwtPayload;

        request.user = {
          id: payload.sub ?? '',
          email: payload.email ?? '',
          name: payload.name ?? payload.preferred_username ?? '',
          roles: (payload.realm_access?.roles as string[]) ?? [],
        };
      } catch {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
    },
  );
};

export default fp(authPlugin, { name: 'auth' });
