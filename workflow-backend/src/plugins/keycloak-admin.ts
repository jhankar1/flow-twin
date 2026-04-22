import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';

export interface KcUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  emailVerified: boolean;
  createdTimestamp: number;
  realmRoles?: string[];
}

export interface KcRole {
  id: string;
  name: string;
  description?: string;
  composite: boolean;
}

class KeycloakAdminClient {
  private token: string | null = null;
  private tokenExpiry = 0;

  constructor(
    private readonly keycloakUrl: string,
    private readonly realm: string,
    private readonly adminUser: string,
    private readonly adminPassword: string,
  ) {}

  private async getAdminToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry) return this.token;

    const res = await fetch(
      `${this.keycloakUrl}/realms/master/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: 'admin-cli',
          username: this.adminUser,
          password: this.adminPassword,
        }).toString(),
      },
    );

    if (!res.ok) throw new Error('[KC Admin] Failed to get admin token');
    const data = await res.json() as { access_token: string; expires_in: number };
    this.token = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 30) * 1000;
    return this.token;
  }

  private async req(path: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getAdminToken();
    return fetch(`${this.keycloakUrl}/admin/realms/${this.realm}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // ── Users ──
  async listUsers(): Promise<KcUser[]> {
    const res = await this.req('/users?max=200');
    if (!res.ok) throw new Error('Failed to list users');
    return res.json();
  }

  async getUser(id: string): Promise<KcUser> {
    const res = await this.req(`/users/${id}`);
    if (!res.ok) throw new Error('User not found');
    return res.json();
  }

  async createUser(data: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    enabled?: boolean;
  }): Promise<string> {
    const res = await this.req('/users', {
      method: 'POST',
      body: JSON.stringify({
        username: data.username,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        enabled: data.enabled ?? true,
        emailVerified: true,
        credentials: [{ type: 'password', value: data.password, temporary: false }],
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as any;
      throw new Error(err.errorMessage ?? 'Failed to create user');
    }
    // Keycloak returns user ID in Location header
    const location = res.headers.get('location') ?? '';
    const id = location.split('/').pop() ?? '';
    return id;
  }

  async updateUser(id: string, data: Partial<{
    email: string;
    firstName: string;
    lastName: string;
    enabled: boolean;
  }>): Promise<void> {
    const res = await this.req(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update user');
  }

  async resetPassword(id: string, password: string): Promise<void> {
    const res = await this.req(`/users/${id}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify({ type: 'password', value: password, temporary: false }),
    });
    if (!res.ok) throw new Error('Failed to reset password');
  }

  async deleteUser(id: string): Promise<void> {
    const res = await this.req(`/users/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete user');
  }

  // ── User roles ──
  async getUserRealmRoles(userId: string): Promise<KcRole[]> {
    const res = await this.req(`/users/${userId}/role-mappings/realm`);
    if (!res.ok) return [];
    return res.json();
  }

  async assignRealmRoles(userId: string, roles: KcRole[]): Promise<void> {
    await this.req(`/users/${userId}/role-mappings/realm`, {
      method: 'POST',
      body: JSON.stringify(roles),
    });
  }

  async removeRealmRoles(userId: string, roles: KcRole[]): Promise<void> {
    await this.req(`/users/${userId}/role-mappings/realm`, {
      method: 'DELETE',
      body: JSON.stringify(roles),
    });
  }

  // ── Realm roles ──
  async listRealmRoles(): Promise<KcRole[]> {
    const res = await this.req('/roles');
    if (!res.ok) throw new Error('Failed to list roles');
    const all: KcRole[] = await res.json();
    // Filter out Keycloak built-in roles
    return all.filter((r) => !['offline_access', 'uma_authorization', 'default-roles-' + this.realm].includes(r.name));
  }

  async createRealmRole(name: string, description?: string): Promise<void> {
    const res = await this.req('/roles', {
      method: 'POST',
      body: JSON.stringify({ name, description: description ?? '' }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as any;
      throw new Error(err.errorMessage ?? 'Failed to create role');
    }
  }

  async deleteRealmRole(name: string): Promise<void> {
    const res = await this.req(`/roles/${encodeURIComponent(name)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete role');
  }

  async getRoleByName(name: string): Promise<KcRole> {
    const res = await this.req(`/roles/${encodeURIComponent(name)}`);
    if (!res.ok) throw new Error(`Role ${name} not found`);
    return res.json();
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    kcAdmin: KeycloakAdminClient;
  }
}

const keycloakAdminPlugin: FastifyPluginAsync = async (fastify) => {
  const client = new KeycloakAdminClient(
    process.env.KEYCLOAK_URL ?? 'http://localhost:8080',
    process.env.KEYCLOAK_REALM ?? 'elb-platform',
    process.env.KEYCLOAK_ADMIN_USER ?? 'admin',
    process.env.KEYCLOAK_ADMIN_PASSWORD ?? 'admin',
  );
  fastify.decorate('kcAdmin', client);
};

export default fp(keycloakAdminPlugin, { name: 'keycloak-admin' });
