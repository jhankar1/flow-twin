"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchFlowById } from "@/services/flows.services";
import { CheckCircle2, Loader2, ChevronRight, ArrowLeft } from "lucide-react";
import Link from "next/link";

type Field = {
  id: string;
  label: string;
  key: string;
  type: "text" | "email" | "number" | "select" | "file";
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
};

type FlowNode = {
  id: string;
  data: {
    label: string;
    meta: { Nodeid: string; category: string; label: string };
    config: {
      title?: string;
      fields?: Field[];
      submitLabel?: string;
    };
  };
};

type FlowEdge = {
  id: string;
  source: string;
  target: string;
};

type Flow = {
  id: string;
  name: string;
  category: string;
  status: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
};

// Walk the graph from flow-start, return nodes in execution order
function getExecutionPath(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Build a map: sourceNodeId → targetNodeId (first output only)
  const nextMap = new Map<string, string>();
  edges.forEach((e) => {
    if (!nextMap.has(e.source)) nextMap.set(e.source, e.target);
  });

  let current = nodes.find((n) => n.data.meta?.Nodeid === "flow-start") ?? nodes[0];
  const path: FlowNode[] = [];
  const visited = new Set<string>();

  while (current && !visited.has(current.id)) {
    path.push(current);
    visited.add(current.id);
    const nextId = nextMap.get(current.id);
    if (!nextId) break;
    current = nodeMap.get(nextId)!;
  }

  return path;
}

export default function RunFlowPage() {
  const { id } = useParams<{ id: string }>();

  const [flow, setFlow] = useState<Flow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formSteps, setFormSteps] = useState<FlowNode[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetchFlowById(id)
      .then((data: Flow) => {
        setFlow(data);
        const path = getExecutionPath(data.nodes, data.edges);
        const steps = path.filter((n) => n.data.meta?.Nodeid === "form-step");
        setFormSteps(steps);
        if (steps.length === 0) setDone(true);
      })
      .catch(() => setError("Failed to load flow"))
      .finally(() => setLoading(false));
  }, [id]);

  const currentStep = formSteps[stepIndex];
  const fields: Field[] = currentStep?.data.config?.fields ?? [];

  const validate = () => {
    const errs: Record<string, string> = {};
    fields.forEach((f) => {
      const val = formValues[f.key] ?? "";
      if (f.required && !val.trim()) {
        errs[f.key] = `${f.label} is required`;
        return;
      }
      if (f.type === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        errs[f.key] = "Invalid email format";
      }
      if (f.type === "number" && val) {
        const n = Number(val);
        if (f.min !== undefined && n < f.min) errs[f.key] = `Minimum is ${f.min}`;
        if (f.max !== undefined && n > f.max) errs[f.key] = `Maximum is ${f.max}`;
      }
    });
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setFormValues({});
      setFieldErrors({});
      if (stepIndex + 1 >= formSteps.length) {
        setDone(true);
      } else {
        setStepIndex((s) => s + 1);
      }
    }, 500);
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
      </div>
    );
  }

  // ── Error ──
  if (error || !flow) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 bg-zinc-950">
        <p className="text-red-400 text-sm">{error ?? "Unknown error"}</p>
        <Link href="/workflows" className="text-xs text-indigo-400 hover:text-indigo-300">
          ← Back to Flows
        </Link>
      </div>
    );
  }

  // ── Done ──
  if (done) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-5 bg-zinc-950">
        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <div className="text-center space-y-1">
          <div className="text-white font-semibold text-lg">{flow.name}</div>
          <div className="text-zinc-400 text-sm">Flow completed successfully</div>
        </div>
        <Link
          href="/workflows"
          className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Flows
        </Link>
      </div>
    );
  }

  const stepTitle = currentStep.data.config?.title || currentStep.data.label || "Form Step";
  const submitLabel = currentStep.data.config?.submitLabel || "Submit & Continue";

  return (
    <div className="h-full overflow-y-auto bg-zinc-950">
      <div className="max-w-lg mx-auto px-4 py-10 space-y-6">

        {/* ── Back + title ── */}
        <div className="flex items-center gap-3">
          <Link
            href="/workflows"
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
          <div>
            <div className="text-xs text-zinc-500 font-medium">{flow.name}</div>
            <div className="text-white text-sm font-semibold">{stepTitle}</div>
          </div>
        </div>

        {/* ── Progress dots ── */}
        {formSteps.length > 1 && (
          <div className="flex items-center gap-1.5">
            {formSteps.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i < stepIndex
                    ? "w-6 bg-green-500"
                    : i === stepIndex
                    ? "w-6 bg-indigo-500"
                    : "w-4 bg-zinc-700"
                }`}
              />
            ))}
            <span className="ml-2 text-xs text-zinc-600">
              {stepIndex + 1} / {formSteps.length}
            </span>
          </div>
        )}

        {/* ── Form card ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">

          {fields.length === 0 ? (
            <div className="text-zinc-500 text-sm py-4 text-center">
              No fields configured for this step.
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((f) => (
                <div key={f.id}>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    {f.label}
                    {f.required && <span className="text-red-400 ml-0.5">*</span>}
                  </label>

                  {f.type === "select" ? (
                    <select
                      className="w-full px-3 py-2.5 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      value={formValues[f.key] ?? ""}
                      onChange={(e) =>
                        setFormValues((v) => ({ ...v, [f.key]: e.target.value }))
                      }
                    >
                      <option value="">Select an option…</option>
                      {f.options?.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  ) : f.type === "number" ? (
                    <input
                      type="number"
                      min={f.min}
                      max={f.max}
                      className="w-full px-3 py-2.5 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      placeholder={
                        f.min !== undefined || f.max !== undefined
                          ? `${f.min ?? ""}–${f.max ?? ""}`
                          : "0"
                      }
                      value={formValues[f.key] ?? ""}
                      onChange={(e) =>
                        setFormValues((v) => ({ ...v, [f.key]: e.target.value }))
                      }
                    />
                  ) : f.type === "email" ? (
                    <input
                      type="email"
                      className="w-full px-3 py-2.5 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      placeholder="name@example.com"
                      value={formValues[f.key] ?? ""}
                      onChange={(e) =>
                        setFormValues((v) => ({ ...v, [f.key]: e.target.value }))
                      }
                    />
                  ) : (
                    <input
                      type="text"
                      className="w-full px-3 py-2.5 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      value={formValues[f.key] ?? ""}
                      onChange={(e) =>
                        setFormValues((v) => ({ ...v, [f.key]: e.target.value }))
                      }
                    />
                  )}

                  {fieldErrors[f.key] && (
                    <p className="text-red-400 text-xs mt-1">{fieldErrors[f.key]}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
