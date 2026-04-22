"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import {
  RefreshCw, CheckCircle2, XCircle, Loader2,
  Database, KeyRound, Clock, Server, Cpu,
} from "lucide-react";

type ServiceStatus = "ok" | "error" | "unknown";

interface ServiceInfo {
  id: string;
  label: string;
  url: string;
  status: ServiceStatus;
  latencyMs: number | null;
  detail?: string;
}

interface ServicesResponse {
  status: "ok" | "degraded";
  infrastructure: ServiceInfo[];
  workers: ServiceInfo[];
}

const SERVICE_ICONS: Record<string, React.ElementType> = {
  postgres: Database,
  keycloak: KeyRound,
  temporal: Clock,
  gateway:  Server,
};

const STATUS_CONFIG = {
  ok:      { icon: CheckCircle2, color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/20",  label: "Online" },
  error:   { icon: XCircle,      color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20",    label: "Offline" },
  unknown: { icon: Loader2,      color: "text-zinc-400",   bg: "bg-zinc-800",      border: "border-zinc-700",      label: "Unknown" },
};

function StatusBadge({ status }: { status: ServiceStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.unknown;
  const Icon = cfg.icon;
  return (
    <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.bg} border ${cfg.border} ${cfg.color}`}>
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
}

function ServiceCard({ svc, isWorker }: { svc: ServiceInfo; isWorker?: boolean }) {
  const Icon = isWorker ? Cpu : (SERVICE_ICONS[svc.id] ?? Server);
  const cfg = STATUS_CONFIG[svc.status] ?? STATUS_CONFIG.unknown;

  return (
    <div className={`bg-zinc-900 border rounded-xl p-4 flex items-center gap-4 ${
      svc.status === "error" ? "border-red-800/40" : "border-zinc-800"
    }`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg} border ${cfg.border}`}>
        <Icon className={`w-4 h-4 ${cfg.color}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white">{svc.label}</div>
        <div className="text-[11px] text-zinc-500 truncate mt-0.5">{svc.url}</div>
        {svc.detail && svc.status === "error" && (
          <div className="text-[10px] text-red-400 mt-0.5 truncate">{svc.detail}</div>
        )}
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <StatusBadge status={svc.status} />
        {svc.latencyMs !== null && svc.status === "ok" && (
          <span className="text-[10px] text-zinc-500">{svc.latencyMs}ms</span>
        )}
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const [data, setData] = useState<ServicesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/admin/services");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastRefresh(new Date());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, 30_000); // auto-refresh every 30s
    return () => clearInterval(id);
  }, [fetch_]);

  const overallOk = data?.status === "ok";
  const infraOk = data?.infrastructure.every((s) => s.status === "ok");
  const workersOnline = data?.workers.filter((w) => w.status === "ok").length ?? 0;
  const workersTotal = data?.workers.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Service Status</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {lastRefresh ? `Last updated ${lastRefresh.toLocaleTimeString()}` : "Loading…"}
            {" · "}Auto-refreshes every 30s
          </p>
        </div>
        <button
          onClick={fetch_}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 transition-colors border border-zinc-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Overall status banner */}
      {data && (
        <div className={`rounded-xl border p-4 flex items-center gap-3 ${
          overallOk
            ? "bg-green-500/5 border-green-500/20"
            : "bg-red-500/5 border-red-500/20"
        }`}>
          {overallOk
            ? <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
            : <XCircle className="w-5 h-5 text-red-400 shrink-0" />
          }
          <div>
            <p className={`text-sm font-semibold ${overallOk ? "text-green-300" : "text-red-300"}`}>
              {overallOk ? "All systems operational" : "Some services are degraded"}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Infrastructure: {infraOk ? "healthy" : "issues detected"} ·{" "}
              Workers: {workersOnline}/{workersTotal} online
            </p>
          </div>
        </div>
      )}

      {loading && !data && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
        </div>
      )}

      {data && (
        <>
          {/* Infrastructure */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Infrastructure</h3>
            <div className="grid grid-cols-2 gap-3">
              {data.infrastructure.map((svc) => (
                <ServiceCard key={svc.id} svc={svc} />
              ))}
            </div>
          </div>

          {/* Workers */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Worker Servers
              <span className="ml-2 text-zinc-600 normal-case font-normal">
                ({workersOnline}/{workersTotal} online)
              </span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {data.workers.map((svc) => (
                <ServiceCard key={svc.id} svc={svc} isWorker />
              ))}
            </div>
            {workersTotal === 0 && (
              <div className="text-center py-8 text-zinc-600 text-xs border border-dashed border-zinc-800 rounded-xl">
                No worker servers configured
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
