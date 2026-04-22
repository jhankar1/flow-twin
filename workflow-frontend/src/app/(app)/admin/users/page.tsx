"use client";

import { useEffect, useState } from "react";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  fetchRoles,
  type AdminUser,
  type AdminRole,
} from "@/services/admin.services";
import {
  UserPlus,
  Pencil,
  Trash2,
  X,
  Check,
  ChevronDown,
  Search,
} from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  Designer: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
  Worker: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  Manager: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  "QA Supervisor": "bg-orange-500/10 text-orange-300 border-orange-500/20",
  "Org Admin": "bg-red-500/10 text-red-300 border-red-500/20",
  "IIoT Admin": "bg-teal-500/10 text-teal-300 border-teal-500/20",
};

function RoleBadge({ role }: { role: string }) {
  const cls = ROLE_COLORS[role] ?? "bg-zinc-700/40 text-zinc-300 border-zinc-600";
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${cls}`}>
      {role}
    </span>
  );
}

interface UserFormData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roles: string[];
}

const EMPTY_FORM: UserFormData = {
  username: "",
  email: "",
  firstName: "",
  lastName: "",
  password: "",
  roles: [],
};

interface UserModalProps {
  editUser?: AdminUser | null;
  allRoles: AdminRole[];
  onSave: (data: UserFormData) => Promise<void>;
  onClose: () => void;
}

function UserModal({ editUser, allRoles, onSave, onClose }: UserModalProps) {
  const [form, setForm] = useState<UserFormData>(
    editUser
      ? {
          username: editUser.username,
          email: editUser.email,
          firstName: editUser.firstName,
          lastName: editUser.lastName,
          password: "",
          roles: editUser.realmRoles,
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof UserFormData, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const toggleRole = (role: string) =>
    set("roles", form.roles.includes(role) ? form.roles.filter((r) => r !== role) : [...form.roles, role]);

  const handleSubmit = async () => {
    if (!form.username || !form.email || !form.firstName || !form.lastName) {
      setError("All fields except password are required");
      return;
    }
    if (!editUser && !form.password) {
      setError("Password is required for new users");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-white">
            {editUser ? "Edit User" : "Invite User"}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name" value={form.firstName} onChange={(v) => set("firstName", v)} />
            <Field label="Last Name" value={form.lastName} onChange={(v) => set("lastName", v)} />
          </div>
          <Field label="Username" value={form.username} onChange={(v) => set("username", v)} disabled={!!editUser} />
          <Field label="Email" type="email" value={form.email} onChange={(v) => set("email", v)} />
          <Field
            label={editUser ? "New Password (leave blank to keep current)" : "Password"}
            type="password"
            value={form.password}
            onChange={(v) => set("password", v)}
          />

          {/* Role picker */}
          <div>
            <label className="block text-xs text-zinc-400 mb-2">Roles</label>
            <div className="flex flex-wrap gap-2">
              {allRoles.map((role) => {
                const selected = form.roles.includes(role.name);
                return (
                  <button
                    key={role.id}
                    onClick={() => toggleRole(role.name)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      selected
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                    }`}
                  >
                    {selected && <Check className="w-3 h-3" />}
                    {role.name}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {saving ? "Saving…" : editUser ? "Save Changes" : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", disabled = false,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition disabled:opacity-40"
      />
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([fetchUsers(), fetchRoles()]);
      setUsers(u);
      setRoles(r);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSave(data: UserFormData) {
    if (editUser) {
      const payload: any = {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        roles: data.roles,
      };
      if (data.password) payload.password = data.password;
      await updateUser(editUser.id, payload);
    } else {
      await createUser(data);
    }
    await load();
  }

  async function handleDelete(id: string) {
    await deleteUser(id);
    setDeleteId(null);
    await load();
  }

  return (
    <div className="max-w-5xl space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users…"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
        <button
          onClick={() => { setEditUser(null); setShowModal(true); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Invite User
        </button>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-zinc-500">
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">Username</th>
              <th className="px-4 py-3 text-left font-medium">Roles</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-500 text-sm">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-600 text-sm">
                  No users found
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-white">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs text-zinc-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{user.username}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.realmRoles.length === 0 ? (
                        <span className="text-zinc-600 text-xs">No roles</span>
                      ) : (
                        user.realmRoles.map((r) => <RoleBadge key={r} role={r} />)
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        user.enabled
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-zinc-700/40 text-zinc-500"
                      }`}
                    >
                      {user.enabled ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {new Date(user.createdTimestamp).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => { setEditUser(user); setShowModal(true); }}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-700 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(user.id)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* User modal */}
      {showModal && (
        <UserModal
          editUser={editUser}
          allRoles={roles}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditUser(null); }}
        />
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-80 shadow-2xl space-y-4">
            <p className="text-sm text-white font-medium">Delete this user?</p>
            <p className="text-xs text-zinc-500">This removes the user from Keycloak. This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
