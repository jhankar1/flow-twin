"use client";

import { useEffect, useState } from "react";
import { fetchRoles, createRole, deleteRole, fetchUsers, type AdminRole } from "@/services/admin.services";
import { Plus, Trash2, Shield, X } from "lucide-react";

interface RoleWithCount extends AdminRole {
  userCount: number;
}

function CreateRoleModal({
  onSave,
  onClose,
}: {
  onSave: (data: { name: string; description: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Role name is required"); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave({ name: name.trim(), description: description.trim() });
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-white">Create Role</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Role Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. QA Supervisor"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What can this role do?"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-800">
          <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {saving ? "Creating…" : "Create Role"}
          </button>
        </div>
      </div>
    </div>
  );
}

const ROLE_COLORS: Record<string, string> = {
  Designer: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
  Worker: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  Manager: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  "QA Supervisor": "bg-orange-500/10 text-orange-300 border-orange-500/20",
  "Org Admin": "bg-red-500/10 text-red-300 border-red-500/20",
  "IIoT Admin": "bg-teal-500/10 text-teal-300 border-teal-500/20",
};

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteRole_, setDeleteRole] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [rolesData, usersData] = await Promise.all([fetchRoles(), fetchUsers()]);
      const withCounts = rolesData.map((role) => ({
        ...role,
        userCount: usersData.filter((u) => u.realmRoles.includes(role.name)).length,
      }));
      setRoles(withCounts);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(data: { name: string; description: string }) {
    await createRole(data);
    await load();
  }

  async function handleDelete(name: string) {
    await deleteRole(name);
    setDeleteRole(null);
    await load();
  }

  return (
    <div className="max-w-3xl space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">{roles.length} roles in this realm</p>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Role
        </button>
      </div>

      {/* Roles list */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-zinc-500">
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Description</th>
              <th className="px-4 py-3 text-left font-medium">Users</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-zinc-500 text-sm">Loading…</td>
              </tr>
            ) : roles.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-zinc-600 text-sm">No roles found</td>
              </tr>
            ) : (
              roles.map((role) => {
                const colorCls = ROLE_COLORS[role.name] ?? "bg-zinc-700/40 text-zinc-300 border-zinc-600";
                return (
                  <tr key={role.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                          <Shield className="w-3.5 h-3.5 text-zinc-400" />
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${colorCls}`}>
                          {role.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">
                      {role.description || <span className="text-zinc-700">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-zinc-400">
                        {role.userCount} {role.userCount === 1 ? "user" : "users"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button
                          onClick={() => setDeleteRole(role.name)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete role"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      {showModal && (
        <CreateRoleModal
          onSave={handleCreate}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Delete confirmation */}
      {deleteRole_ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-80 shadow-2xl space-y-4">
            <p className="text-sm text-white font-medium">Delete role "{deleteRole_}"?</p>
            <p className="text-xs text-zinc-500">
              This removes the role from Keycloak. Users with this role will lose it. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteRole(null)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteRole_)}
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
