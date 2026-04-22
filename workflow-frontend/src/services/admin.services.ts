import { apiFetch } from "@/lib/api";

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  createdTimestamp: number;
  realmRoles: string[];
}

export interface AdminRole {
  id: string;
  name: string;
  description?: string;
  composite: boolean;
}

// ── Users ──────────────────────────────────────────────────────────────

export async function fetchUsers(): Promise<AdminUser[]> {
  const res = await apiFetch("/admin/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function fetchUser(id: string): Promise<AdminUser> {
  const res = await apiFetch(`/admin/users/${id}`);
  if (!res.ok) throw new Error("User not found");
  return res.json();
}

export async function createUser(data: {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roles: string[];
}): Promise<{ id: string }> {
  const res = await apiFetch("/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to create user");
  return json;
}

export async function updateUser(
  id: string,
  data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    enabled?: boolean;
    password?: string;
    roles?: string[];
  }
): Promise<void> {
  const res = await apiFetch(`/admin/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({})) as any;
    throw new Error(json.error ?? "Failed to update user");
  }
}

export async function deleteUser(id: string): Promise<void> {
  const res = await apiFetch(`/admin/users/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete user");
}

// ── Roles ───────────────────────────────────────────────────────────────

export async function fetchRoles(): Promise<AdminRole[]> {
  const res = await apiFetch("/admin/roles");
  if (!res.ok) throw new Error("Failed to fetch roles");
  return res.json();
}

export async function createRole(data: { name: string; description?: string }): Promise<void> {
  const res = await apiFetch("/admin/roles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({})) as any;
    throw new Error(json.error ?? "Failed to create role");
  }
}

export async function deleteRole(name: string): Promise<void> {
  const res = await apiFetch(`/admin/roles/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete role");
}
