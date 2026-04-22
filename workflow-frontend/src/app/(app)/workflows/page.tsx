"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useFlowsStore } from "@/store/flows.store";
import { useAuthStore } from "@/store/auth.store";
import {
  Plus, ShoppingCart, Briefcase, Factory, GitBranch,
  CheckCircle2, Clock, Workflow, Search, Play, Pencil,
  Loader2, Blocks, Database, Lock,
} from "lucide-react";

type Tab = "All" | "General" | "Node" | "Master";
const TABS: Tab[] = ["All", "General", "Node", "Master"];

const CATEGORY_META: Record<string, { icon: React.ElementType; text: string; bg: string; border: string; dot: string }> = {
  Industrial: { icon: Factory,      text: "text-teal-400",   bg: "bg-teal-500/10",   border: "border-teal-500/20",   dot: "bg-teal-400" },
  Customer:   { icon: ShoppingCart, text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", dot: "bg-orange-400" },
  Business:   { icon: Briefcase,    text: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20",    dot: "bg-red-400" },
};

const FLOW_TYPE_META = {
  general: { icon: GitBranch, label: "General", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
  node:    { icon: Blocks,    label: "Node",    color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  master:  { icon: Database,  label: "Master",  color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20" },
};

const FALLBACK_META = { icon: Workflow, text: "text-zinc-400", bg: "bg-zinc-800", border: "border-zinc-700", dot: "bg-zinc-500" };

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function WorkflowsPage() {
  const { flows, isLoading: loading, load } = useFlowsStore();
  const userRoles: string[] = useAuthStore((s) => s.roles ?? []);
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, [load]);

  const filtered = flows.filter((f) => {
    const matchTab =
      activeTab === "All" ||
      (activeTab === "General" && f.flowType === "general") ||
      (activeTab === "Node"    && f.flowType === "node") ||
      (activeTab === "Master"  && f.flowType === "master");
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const canRun = (flow: (typeof flows)[number]) => {
    if (flow.flowType !== "master") return true;
    const roles = flow.runnableByRoles ?? [];
    if (roles.length === 0) return true;
    return roles.some((r) => userRoles.includes(r));
  };

  const tabCounts = {
    All:     flows.length,
    General: flows.filter((f) => f.flowType === "general").length,
    Node:    flows.filter((f) => f.flowType === "node").length,
    Master:  flows.filter((f) => f.flowType === "master").length,
  };

  return (
    <div className="h-full overflow-y-auto bg-zinc-950">
      <div className="max-w-6xl mx-auto p-6 space-y-6">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Flows</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {loading ? "Loading…" : `${flows.length} flow${flows.length !== 1 ? "s" : ""} saved`}
            </p>
          </div>
          <Link
            href="/builder"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Flow
          </Link>
        </div>

        {/* ── Tabs + Search ── */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
            {TABS.map((tab) => {
              const count = tabCounts[tab];
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    activeTab === tab ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {tab === "Node" && <Blocks className="w-3 h-3 text-violet-400" />}
                  {tab === "Master" && <Database className="w-3 h-3 text-amber-400" />}
                  {tab === "General" && <GitBranch className="w-3 h-3 text-indigo-400" />}
                  {tab}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab ? "bg-zinc-600 text-zinc-200" : "bg-zinc-800 text-zinc-500"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
            <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <input
              placeholder="Search flows…"
              className="flex-1 bg-transparent text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Workflow className="w-10 h-10 text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-500">
              {flows.length === 0 ? "No flows yet" : "No flows match your filter"}
            </p>
            <Link href="/builder" className="mt-3 text-xs text-indigo-400 hover:text-indigo-300">
              Create your first flow →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filtered.map((flow) => {
              const catMeta = CATEGORY_META[flow.category] ?? FALLBACK_META;
              const CatIcon = catMeta.icon;
              const isPublished = flow.status === "published";
              const ftMeta = FLOW_TYPE_META[flow.flowType] ?? FLOW_TYPE_META.general;
              const FtIcon = ftMeta.icon;
              const userCanRun = canRun(flow);
              const isMaster = flow.flowType === "master";

              return (
                <div
                  key={flow.id}
                  className={`bg-zinc-900 border rounded-xl p-5 flex flex-col gap-4 transition-colors group ${
                    isMaster ? "border-amber-800/40 hover:border-amber-700/60" : "border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg ${catMeta.bg} border ${catMeta.border} flex items-center justify-center shrink-0`}>
                        <CatIcon className={`w-4 h-4 ${catMeta.text}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white leading-tight truncate">{flow.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-xs ${catMeta.text} font-medium`}>{flow.category || "—"}</span>
                          <span className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${ftMeta.bg} border ${ftMeta.border} ${ftMeta.color}`}>
                            <FtIcon className="w-2.5 h-2.5" />
                            {ftMeta.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status badge */}
                    <span className={`shrink-0 flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      isPublished
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                    }`}>
                      {isPublished ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                      {isPublished ? "Published" : "Draft"}
                    </span>
                  </div>

                  {/* Master flow role pills */}
                  {isMaster && (flow.runnableByRoles?.length > 0 || flow.visibleToRoles?.length > 0) && (
                    <div className="space-y-1">
                      {flow.visibleToRoles?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[9px] text-zinc-600 pt-0.5">Visible:</span>
                          {flow.visibleToRoles.map((r) => (
                            <span key={r} className="text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">{r}</span>
                          ))}
                        </div>
                      )}
                      {flow.runnableByRoles?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[9px] text-zinc-600 pt-0.5">Run:</span>
                          {flow.runnableByRoles.map((r) => (
                            <span key={r} className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">{r}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <GitBranch className="w-3 h-3" />
                      {flow.nodeCount} node{flow.nodeCount !== 1 ? "s" : ""}
                    </span>
                    <span>Saved {timeAgo(flow.savedAt)}</span>
                  </div>

                  {/* Footer actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                    <Link
                      href={`/builder?id=${flow.id}`}
                      className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </Link>

                    {isPublished ? (
                      userCanRun ? (
                        <Link
                          href={`/run/${flow.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          Run
                        </Link>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-zinc-600">
                          <Lock className="w-3 h-3" />
                          No access
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-zinc-600">Publish to run</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
