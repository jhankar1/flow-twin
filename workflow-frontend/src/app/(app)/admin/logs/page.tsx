"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  userId: string;
  userName: string;
  meta: Record<string, unknown>;
  ip?: string;
  createdAt: string;
}

const ACTION_COLORS: Record<string, string> = {
  "auth.login":       "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "auth.logout":      "bg-zinc-700/40 text-zinc-400 border-zinc-600",
  "flow.create":      "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "flow.save":        "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
  "flow.publish":     "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "flow.delete":      "bg-red-500/10 text-red-400 border-red-500/20",
  "approval.submit":  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "approval.approved":"bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "approval.rejected":"bg-red-500/10 text-red-400 border-red-500/20",
  "user.create":      "bg-teal-500/10 text-teal-400 border-teal-500/20",
  "user.update":      "bg-sky-500/10 text-sky-400 border-sky-500/20",
  "user.delete":      "bg-red-500/10 text-red-400 border-red-500/20",
  "role.create":      "bg-teal-500/10 text-teal-400 border-teal-500/20",
  "role.delete":      "bg-red-500/10 text-red-400 border-red-500/20",
};

function ActionBadge({ action }: { action: string }) {
  const cls = ACTION_COLORS[action] ?? "bg-zinc-700/40 text-zinc-400 border-zinc-600";
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${cls}`}>
      {action}
    </span>
  );
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (entity) params.set("entity", entity);
      if (action) params.set("action", action);
      const res = await apiFetch(`/logs?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setLogs(data.logs);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [entity, action]);

  const entities = ["flow", "approval", "user", "role"];
  const actions = Object.keys(ACTION_COLORS);

  return (
    <div className="max-w-5xl space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={entity}
          onChange={(e) => { setEntity(e.target.value); setAction(""); }}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
        >
          <option value="">All entities</option>
          {entities.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>

        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
        >
          <option value="">All actions</option>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>

        <button
          onClick={load}
          className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm transition-colors"
        >
          Refresh
        </button>

        <span className="text-xs text-zinc-600 ml-auto">{total} total entries</span>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-zinc-500">
              <th className="px-4 py-3 text-left font-medium">Time</th>
              <th className="px-4 py-3 text-left font-medium">Action</th>
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">Details</th>
              <th className="px-4 py-3 text-left font-medium">IP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-500 text-sm">Loading…</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-600 text-sm">No logs found</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                  <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <ActionBadge action={log.action} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-medium text-white">{log.userName}</div>
                    <div className="text-[11px] text-zinc-600 font-mono">{log.userId.slice(0, 8)}…</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400 max-w-xs truncate">
                    {Object.entries(log.meta ?? {})
                      .filter(([, v]) => v !== null && v !== undefined)
                      .map(([k, v]) => `${k}: ${String(v)}`)
                      .join(" · ") || <span className="text-zinc-700">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-600 font-mono">
                    {log.ip ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
