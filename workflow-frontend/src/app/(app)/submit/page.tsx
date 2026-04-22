"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitApproval } from "@/services/approvals.services";
import DynamicSelect from "@/components/ui/DynamicSelect";
import { Send, CheckCircle } from "lucide-react";

/**
 * FIELDS config — in real ENB mode this comes from the published flow's node config.
 * field types:
 *   text | number | select (static) | flow-select (options from a published flow)
 *
 * flow-select fields:
 *   sourceFlowId — which published flow to call
 *   inputFrom    — key of another field whose value is passed as input to the flow
 */
const FIELDS = [
  { key: "supplierName",  label: "Supplier Name",      type: "text",        placeholder: "e.g. ABC Farms" },
  { key: "inputWeight",   label: "Input Weight (kg)",  type: "number",      placeholder: "e.g. 250" },
  { key: "qualityGrade",  label: "Quality Grade",      type: "select",      options: ["A", "B", "C"] },
  // Example flow-driven chained select — uncomment and set real flowId after publishing a lookup flow:
  // { key: "variety", label: "Variety", type: "flow-select", sourceFlowId: "<published-flow-id>", inputFrom: "supplierName" },
];

export default function SubmitPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = (key: string, value: string) =>
    setFields((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    const missing = FIELDS.find((f) => !fields[f.key]);
    if (missing) { setError(`${missing.label} is required`); return; }

    setSubmitting(true);
    setError(null);
    try {
      await submitApproval({ title, description, fieldValues: fields });
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
          <CheckCircle className="w-7 h-7 text-emerald-400" />
        </div>
        <h2 className="text-lg font-semibold text-white">Submitted for Approval</h2>
        <p className="text-sm text-zinc-500">
          Your entry has been sent to a supervisor for review. You will be notified once a decision is made.
        </p>
        <div className="flex gap-2 justify-center pt-2">
          <button
            onClick={() => { setSubmitted(false); setTitle(""); setDescription(""); setFields({}); }}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm transition-colors"
          >
            Submit Another
          </button>
          <button
            onClick={() => router.push("/approvals")}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors"
          >
            View Approvals
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h1 className="text-base font-semibold text-white">Submit for Approval</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Fill in the details below. A supervisor will review and approve your entry.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Request Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Turmeric Batch Intake — April 4"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Notes (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Any additional context for the supervisor…"
            rows={2}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition resize-none"
          />
        </div>

        {/* Dynamic fields */}
        <div className="border-t border-zinc-800 pt-4 space-y-3">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Step Data</p>
          {FIELDS.map((field: any) => (
            <div key={field.key}>
              <label className="block text-xs text-zinc-400 mb-1.5">{field.label}</label>

              {/* Static select */}
              {field.type === "select" && (
                <select
                  value={fields[field.key] ?? ""}
                  onChange={(e) => setField(field.key, e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="">Select…</option>
                  {field.options?.map((o: string) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              )}

              {/* Flow-driven select — options fetched live from a published flow */}
              {field.type === "flow-select" && field.sourceFlowId && (
                <div>
                  <DynamicSelect
                    flowId={field.sourceFlowId}
                    inputValue={field.inputFrom ? fields[field.inputFrom] : undefined}
                    value={fields[field.key] ?? ""}
                    onChange={(v) => setField(field.key, v)}
                    placeholder={`Select ${field.label}…`}
                  />
                  {field.inputFrom && !fields[field.inputFrom] && (
                    <p className="text-[10px] text-zinc-600 mt-1">
                      Select <strong>{field.inputFrom}</strong> first to load options
                    </p>
                  )}
                </div>
              )}

              {/* Text / number */}
              {field.type !== "select" && field.type !== "flow-select" && (
                <input
                  type={field.type}
                  value={fields[field.key] ?? ""}
                  onChange={(e) => setField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition"
                />
              )}
            </div>
          ))}
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
        >
          <Send className="w-4 h-4" />
          {submitting ? "Submitting…" : "Submit for Approval"}
        </button>
      </div>
    </div>
  );
}
