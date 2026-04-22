import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { emitEvent } from '../lib/audit.js';

const CreateUserSchema = z.object({
  username: z.string().min(2),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(6),
  roles: z.array(z.string()).default([]),
});

const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
  password: z.string().min(6).optional(),
  roles: z.array(z.string()).optional(),
});

const CreateRoleSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

function requireRole(...roles: string[]) {
  return async function guard(request: any, reply: any) {
    const userRoles: string[] = request.user?.roles ?? [];
    const hasRole = roles.some((r) => userRoles.includes(r));
    if (!hasRole) return reply.code(403).send({ error: 'Forbidden' });
  };
}

const adminRoute: FastifyPluginAsync = async (fastify) => {
  const kc = fastify.kcAdmin;
  const auth = [fastify.verifyJwt];
  const adminOnly = [fastify.verifyJwt, requireRole('Org Admin', 'Manager')];

  // ── Users ──────────────────────────────────────────────────────────────

  // GET /api/admin/users
  fastify.get('/admin/users', { onRequest: auth }, async () => {
    const users = await kc.listUsers();
    const withRoles = await Promise.all(
      users.map(async (u) => {
        const roles = await kc.getUserRealmRoles(u.id);
        return { ...u, realmRoles: roles.map((r) => r.name) };
      }),
    );
    return withRoles;
  });

  // GET /api/admin/users/:id
  fastify.get<{ Params: { id: string } }>(
    '/admin/users/:id',
    { onRequest: auth },
    async (request, reply) => {
      try {
        const user = await kc.getUser(request.params.id);
        const roles = await kc.getUserRealmRoles(user.id);
        return { ...user, realmRoles: roles.map((r) => r.name) };
      } catch {
        return reply.code(404).send({ error: 'User not found' });
      }
    },
  );

  // POST /api/admin/users
  fastify.post('/admin/users', { onRequest: adminOnly }, async (request, reply) => {
    const parse = CreateUserSchema.safeParse(request.body);
    if (!parse.success) return reply.code(400).send({ error: 'Validation failed', issues: parse.error.issues });

    const { roles, ...userData } = parse.data;

    const userId = await kc.createUser(userData);

    if (roles.length > 0) {
      const roleObjects = await Promise.all(roles.map((name) => kc.getRoleByName(name)));
      await kc.assignRealmRoles(userId, roleObjects);
    }

    emitEvent(fastify, request, 'user.create', 'user', userId, { username: userData.username, roles });
    return reply.code(201).send({ id: userId });
  });

  // PATCH /api/admin/users/:id
  fastify.patch<{ Params: { id: string } }>(
    '/admin/users/:id',
    { onRequest: adminOnly },
    async (request, reply) => {
      const parse = UpdateUserSchema.safeParse(request.body);
      if (!parse.success) return reply.code(400).send({ error: 'Validation failed', issues: parse.error.issues });

      const { roles, password, ...profileData } = parse.data;

      if (Object.keys(profileData).length > 0) {
        await kc.updateUser(request.params.id, profileData);
      }

      if (password) {
        await kc.resetPassword(request.params.id, password);
      }

      if (roles !== undefined) {
        // Replace roles: remove all current, assign new
        const currentRoles = await kc.getUserRealmRoles(request.params.id);
        if (currentRoles.length > 0) await kc.removeRealmRoles(request.params.id, currentRoles);
        if (roles.length > 0) {
          const roleObjects = await Promise.all(roles.map((name) => kc.getRoleByName(name)));
          await kc.assignRealmRoles(request.params.id, roleObjects);
        }
      }

      emitEvent(fastify, request, 'user.update', 'user', request.params.id,
        { roles, passwordChanged: !!password });
      return { ok: true };
    },
  );

  // DELETE /api/admin/users/:id
  fastify.delete<{ Params: { id: string } }>(
    '/admin/users/:id',
    { onRequest: adminOnly },
    async (request, reply) => {
      try {
        await kc.deleteUser(request.params.id);
        emitEvent(fastify, request, 'user.delete', 'user', request.params.id);
        return { deleted: request.params.id };
      } catch {
        return reply.code(404).send({ error: 'User not found' });
      }
    },
  );

  // ── Roles ───────────────────────────────────────────────────────────────

  // GET /api/admin/roles
  fastify.get('/admin/roles', { onRequest: auth }, async () => kc.listRealmRoles());

  // POST /api/admin/roles
  fastify.post('/admin/roles', { onRequest: adminOnly }, async (request, reply) => {
    const parse = CreateRoleSchema.safeParse(request.body);
    if (!parse.success) return reply.code(400).send({ error: 'Validation failed', issues: parse.error.issues });

    await kc.createRealmRole(parse.data.name, parse.data.description);
    emitEvent(fastify, request, 'role.create', 'role', undefined, { name: parse.data.name });
    return reply.code(201).send({ ok: true });
  });

  // DELETE /api/admin/roles/:name
  fastify.delete<{ Params: { name: string } }>(
    '/admin/roles/:name',
    { onRequest: adminOnly },
    async (request, reply) => {
      try {
        await kc.deleteRealmRole(request.params.name);
        emitEvent(fastify, request, 'role.delete', 'role', undefined, { name: request.params.name });
        return { deleted: request.params.name };
      } catch {
        return reply.code(404).send({ error: 'Role not found' });
      }
    },
  );
};

export default adminRoute;
