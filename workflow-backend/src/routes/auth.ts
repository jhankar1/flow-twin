import type { FastifyPluginAsync } from 'fastify';
import jwt from 'jsonwebtoken';
import { emitEvent } from '../lib/audit.js';

const authRoute: FastifyPluginAsync = async (fastify) => {
  const keycloakUrl = process.env.KEYCLOAK_URL ?? 'http://localhost:8080';
  const realm = process.env.KEYCLOAK_REALM ?? 'elb-platform';
  const clientId = process.env.KEYCLOAK_CLIENT_ID ?? 'workflow-backend';
  const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET ?? '';
  const tokenEndpoint = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`;
  const logoutEndpoint = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/logout`;
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

  // POST /api/auth/login — accept username/password, exchange with Keycloak, set cookie
  fastify.post<{ Body: { username: string; password: string } }>(
    '/auth/login',
    async (request, reply) => {
      const { username, password } = request.body ?? {};
      if (!username || !password) {
        return reply.code(400).send({ error: 'username and password are required' });
      }

      const body = new URLSearchParams({
        grant_type: 'password',
        client_id: clientId,
        client_secret: clientSecret,
        username,
        password,
        scope: 'openid profile email',
      });

      const res = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as any;
        fastify.log.error({ keycloakStatus: res.status, keycloakError: err }, 'Keycloak login failed');
        const msg = err.error_description ?? err.error ?? 'Invalid credentials';
        return reply.code(401).send({ error: msg });
      }

      const tokens = await res.json() as { access_token: string; refresh_token: string; expires_in: number };

      reply.setCookie('access_token', tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: tokens.expires_in,
      });

      reply.setCookie('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });

      // Login has no JWT yet — emit event directly
      fastify.emit({
        type: 'auth.login',
        entity: 'user',
        userId: username,
        userName: username,
        ip: request.ip,
        meta: {},
        timestamp: new Date(),
      });

      return { ok: true };
    },
  );

  // POST /api/auth/refresh — get new access token using refresh token
  fastify.post('/auth/refresh', async (request, reply) => {
    const refreshToken = (request.cookies as Record<string, string | undefined>)['refresh_token'];
    if (!refreshToken) return reply.code(401).send({ error: 'No refresh token' });

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    });

    const res = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      reply.clearCookie('access_token').clearCookie('refresh_token');
      return reply.code(401).send({ error: 'Session expired' });
    }

    const tokens = await res.json() as { access_token: string; refresh_token: string; expires_in: number };

    reply.setCookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: tokens.expires_in,
    });

    return { ok: true };
  });

  // POST /api/auth/logout — clear cookies and redirect to Keycloak logout
  fastify.post('/auth/logout', async (request, reply) => {
    const refreshToken = (request.cookies as Record<string, string | undefined>)['refresh_token'];

    reply.clearCookie('access_token', { path: '/' });
    reply.clearCookie('refresh_token', { path: '/' });

    // Revoke session in Keycloak if refresh token present
    if (refreshToken) {
      const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      });
      await fetch(`${keycloakUrl}/realms/${realm}/protocol/openid-connect/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      }).catch(() => {/* best-effort */});
    }

    emitEvent(fastify, request, 'auth.logout', 'user', request.user?.id);
    return { logoutUrl: `${logoutEndpoint}?post_logout_redirect_uri=${frontendUrl}/login&client_id=${clientId}` };
  });

  // GET /api/auth/me — return current user from cookie token
  fastify.get('/auth/me', { onRequest: [fastify.verifyJwt] }, async (request) => {
    return request.user;
  });
};

export default authRoute;
