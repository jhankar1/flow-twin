"use client";

import { useEffect, useState } from "react";
import {
  fetchApprovals,
  decideApproval,
  type ApprovalRequest,
} from "@/services/approvals.services";
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  if (status === "approved")
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CheckCircle className="w-3 h-3" /> Approved
      </span>
    );
  if (status === "rejected")
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
        <XCircle className="w-3 h-3" /> Rejected
      </span>
    );
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
      <Clock className="w-3 h-3" /> Pending
    </span>
  );
}

function ApprovalCard({
  req,
  onDecide,
}: {
  req: ApprovalRequest;
  onDecide: (id: string, decision: "approved" | "rejected", reason?: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [reason, setReason] = useState("");
  const [deciding, setDeciding] = useState(false);

  const decide = async (decision: "approved" | "rejected") => {
    setDeciding(true);
    try {
      await onDecide(req.id, decision, reason || undefined);
    } finally {
      setDeciding(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-zinc-800/30 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <div className="text-sm font-medium text-white truncate">{req.title}</div>
            <div className="text-xs text-zinc-500 mt-0.5">
              by <span className="text-zinc-400">{req.submitterName}</span> ·{" "}
              {new Date(req.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          <StatusBadge status={req.status} />
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-zinc-800 px-4 py-4 space-y-4">
          {/* Description */}
          {req.description && (
            <p className="text-xs text-zinc-400 bg-zinc-800/50 rounded-lg px-3 py-2">
              {req.description}
            </p>
          )}

          {/* Field values */}
          {Object.keys(req.fieldValues).length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(req.fieldValues).map(([k, v]) => (
                <div key={k} className="bg-zinc-800 rounded-lg px-3 py-2">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{k}</div>
                  <div className="text-sm text-white font-medium mt-0.5">{String(v)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Decision info (already decided) */}
          {req.status !== "pending" && (
            <div className="bg-zinc-800/50 rounded-lg px-3 py-2 text-xs text-zinc-400 space-y-0.5">
              <div>
                Decision by <span className="text-zinc-300">{req.deciderName}</span>
                {req.decidedAt && ` · ${new Date(req.decidedAt).toLocaleString()}`}
              </div>
              {req.reason && <div>Reason: <span className="text-zinc-300">{req.reason}</span></div>}
            </div>
          )}

          {/* Approve / Reject actions */}
          {req.status === "pending" && (
            <div className="space-y-2">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason / comment (optional)"
                rows={2}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => decide("approved")}
                  disabled={deciding}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => decide("rejected")}
                  disabled={deciding}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "all">("pending");

  async function load() {
    setLoading(true);
    try {
      const data = await fetchApprovals();
      setRequests(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = tab === "pending"
    ? requests.filter((r) => r.status === "pending")
    : requests;

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  async function handleDecide(id: string, decision: "approved" | "rejected", reason?: string) {
    await decideApproval(id, decision, reason);
    await load();
  }

  return (
    <div className="max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-white">Approvals</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Review and action pending requests</p>
        </div>
        <button
          onClick={load}
          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-800 pb-0">
        {[
          { key: "pending", label: `Pending${pendingCount > 0 ? ` (${pendingCount})` : ""}` },
          { key: "all", label: "All" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? "border-indigo-500 text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-10 text-zinc-500 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-zinc-600 text-sm">
          {tab === "pending" ? "No pending approvals" : "No requests yet"}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((req) => (
            <ApprovalCard key={req.id} req={req} onDecide={handleDecide} />
          ))}
        </div>
      )}
    </div>
  );
}
