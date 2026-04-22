"use client";

import Link from "next/link";
import {
  GitBranch,
  Activity,
  Radio,
  Users,
  ShoppingCart,
  Briefcase,
  Factory,
  Plus,
  ArrowRight,
  Cpu,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";

const STATS = [
  { label: "Total Flows", value: "12", sub: "3 published", icon: GitBranch, color: "#6366f1" },
  { label: "Active Batches", value: "4", sub: "running now", icon: Activity, color: "#22c55e" },
  { label: "Live Monitors", value: "7", sub: "sensor watches", icon: Radio, color: "#f97316" },
  { label: "Workers", value: "9", sub: "registered", icon: Users, color: "#a855f7" },
];

const PROCESS_CATEGORIES = [
  {
    key: "customer",
    label: "Customer Process",
    icon: ShoppingCart,
    color: "#f97316",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    text: "text-orange-400",
    description: "Public-facing flows. Customer is the actor. Bus booking, loan applications, KYC.",
    flows: 3,
    example: "Bus Ticket Booking",
  },
  {
    key: "business",
    label: "Business Process",
    icon: Briefcase,
    color: "#14b8a6",
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
    text: "text-teal-400",
    description: "Internal operations. Employee onboarding, leave approvals, document workflows.",
    flows: 4,
    example: "Employee Onboarding",
  },
  {
    key: "industrial",
    label: "Industrial Process",
    icon: Factory,
    color: "#ef4444",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    text: "text-red-400",
    description: "Factory floor. Workers + sensors + machines + QA approvals. IIoT integration.",
    flows: 5,
    example: "Ginger Syrup Extraction",
  },
];

const RECENT_FLOWS = [
  { name: "Ginger Syrup Extraction", category: "Industrial", status: "active", batches: 41, lastRun: "2h ago", statusColor: "text-green-400", statusBg: "bg-green-500/10" },
  { name: "Turmeric Processing", category: "Industrial", status: "draft", batches: 12, lastRun: "1d ago", statusColor: "text-zinc-400", statusBg: "bg-zinc-500/10" },
  { name: "Bus Ticket Booking", category: "Customer", status: "active", batches: 203, lastRun: "5m ago", statusColor: "text-green-400", statusBg: "bg-green-500/10" },
  { name: "Employee Onboarding", category: "Business", status: "active", batches: 8, lastRun: "3h ago", statusColor: "text-green-400", statusBg: "bg-green-500/10" },
  { name: "QA Inspection Form", category: "Industrial", status: "paused", batches: 29, lastRun: "2d ago", statusColor: "text-amber-400", statusBg: "bg-amber-500/10" },
];

const CATEGORY_BADGE: Record<string, { text: string; bg: string }> = {
  Industrial: { text: "text-red-400", bg: "bg-red-500/10" },
  Customer: { text: "text-orange-400", bg: "bg-orange-500/10" },
  Business: { text: "text-teal-400", bg: "bg-teal-500/10" },
};

const STATUS_ICON: Record<string, React.ElementType> = {
  active: CheckCircle2,
  draft: Clock,
  paused: AlertTriangle,
};

export default function DashboardPage() {
  return (
    <div className="h-full overflow-y-auto bg-zinc-950">
      <div className="max-w-6xl mx-auto p-6 space-y-8">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Overview of your digital twin platform</p>
          </div>
          <Link
            href="/builder"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Flow
          </Link>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-4 gap-4">
          {STATS.map(({ label, value, sub, icon: Icon, color }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-zinc-500 font-medium">{label}</span>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: color + "18" }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{sub}</div>
            </div>
          ))}
        </div>

        {/* ── Typeform analogy callout ── */}
        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 bg-indigo-500/10 rounded-lg flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white mb-1">How the platform works</div>
              <div className="grid grid-cols-3 gap-4 text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                  <span><span className="text-zinc-200 font-medium">Designer</span> builds a flow on the canvas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                  <span><span className="text-zinc-200 font-medium">Worker</span> executes it step by step</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                  <span><span className="text-zinc-200 font-medium">Supervisor</span> sees everything in real time</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Three process categories ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-300">Process Categories</h2>
            <span className="text-xs text-zinc-600">Same canvas. Same engine. Three domains.</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {PROCESS_CATEGORIES.map(({ label, icon: Icon, bg, border, text, description, flows, example }) => (
              <div key={label} className={`bg-zinc-900 border ${border} rounded-xl p-5 space-y-3 hover:bg-zinc-800/50 transition-colors cursor-default`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg ${bg} border ${border} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${text}`} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{label}</div>
                    <div className={`text-xs ${text}`}>{flows} flows</div>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
                <div className="pt-1 border-t border-zinc-800">
                  <span className="text-xs text-zinc-600">e.g. </span>
                  <span className="text-xs text-zinc-400">{example}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Recent flows ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-300">Recent Flows</h2>
            <Link href="/workflows" className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left text-xs text-zinc-500 font-medium px-4 py-3">Flow Name</th>
                  <th className="text-left text-xs text-zinc-500 font-medium px-4 py-3">Category</th>
                  <th className="text-left text-xs text-zinc-500 font-medium px-4 py-3">Status</th>
                  <th className="text-left text-xs text-zinc-500 font-medium px-4 py-3">Batches</th>
                  <th className="text-left text-xs text-zinc-500 font-medium px-4 py-3">Last Run</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {RECENT_FLOWS.map((flow, i) => {
                  const badge = CATEGORY_BADGE[flow.category];
                  const StatusIcon = STATUS_ICON[flow.status];
                  return (
                    <tr key={i} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-white font-medium">{flow.name}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
                          {flow.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1.5 text-xs font-medium ${flow.statusColor}`}>
                          <StatusIcon className="w-3 h-3" />
                          {flow.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-400">{flow.batches}</td>
                      <td className="px-4 py-3 text-xs text-zinc-500">{flow.lastRun}</td>
                      <td className="px-4 py-3">
                        <Link href="/builder" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                          Open →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
