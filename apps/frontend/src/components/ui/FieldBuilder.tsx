"use client";

import { useFlowStore } from "@/store/flow.store";
import { useEffect, useState } from "react";
import { fetchFlowList } from "@/services/flows.services";
import { Plus, Trash2, GitBranch } from "lucide-react";

const FIELD_TYPES = ["text", "email", "number", "select", "flow-select", "file"];

// ── Fetch published flows for the flow-select source picker
function usePublishedFlows() {
  const [flows, setFlows] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    fetchFlowList().then((list) =>
      setFlows(list.filter((f: any) => f.status === "published").map((f: any) => ({ id: f.id, name: f.name })))
    ).catch(() => {});
  }, []);
  return flows;
}

export default function FieldBuilder({ node, fieldKey }: any) {
  const updateNodeConfig = useFlowStore((s) => s.updateNodeConfig);
  const publishedFlows = usePublishedFlows();

  const fields: any[] = node.data.config[fieldKey] || [];

  const updateFields = (newFields: any[]) => {
    updateNodeConfig(node.id, fieldKey, newFields);
  };

  const addField = () => {
    updateFields([
      ...fields,
      { id: crypto.randomUUID(), label: "New Field", key: `field_${fields.length + 1}`, type: "text", required: false },
    ]);
  };

  const toKey = (label: string) =>
    label.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

  const updateField = (index: number, key: string, value: any) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };
    if (key === "label") updated[index].key = toKey(value) || `field_${index + 1}`;
    updateFields(updated);
  };

  const updateFieldType = (index: number, newType: string) => {
    const base: any = { ...fields[index], type: newType };
    if (newType === "select") base.options = base.options ?? [];
    if (newType === "flow-select") {
      base.sourceFlowId = base.sourceFlowId ?? "";
      base.inputFrom = base.inputFrom ?? "";   // key of another field whose value feeds this flow
    }
    if (newType === "number") { base.min = undefined; base.max = undefined; }
    const updated = [...fields];
    updated[index] = base;
    updateFields(updated);
  };

  const removeField = (index: number) => updateFields(fields.filter((_: any, i: number) => i !== index));

  // All field keys in this node (for inputFrom picker)
  const fieldKeys = fields.map((f: any) => ({ key: f.key, label: f.label }));

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-zinc-300">Form Fields</div>

      {fields.map((f: any, i: number) => (
        <div key={f.id} className="p-3 border border-zinc-700 rounded-lg bg-zinc-800/60 space-y-2">

          {/* Label */}
          <input
            className="w-full p-1.5 text-xs bg-zinc-900 border border-zinc-700 rounded"
            value={f.label}
            onChange={(e) => updateField(i, "label", e.target.value)}
            placeholder="Field Label"
          />

          {/* Key (auto) */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900/60 border border-zinc-700/50 rounded">
            <span className="text-[10px] text-zinc-600 shrink-0">key</span>
            <span className="text-[10px] font-mono text-zinc-400">{f.key || "—"}</span>
          </div>

          {/* Type */}
          <select
            className="w-full p-1.5 text-xs bg-zinc-900 border border-zinc-700 rounded"
            value={f.type}
            onChange={(e) => updateFieldType(i, e.target.value)}
          >
            {FIELD_TYPES.map((t) => (
              <option key={t} value={t}>{t === "flow-select" ? "select (from flow)" : t}</option>
            ))}
          </select>

          {/* Required */}
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Required</span>
            <input type="checkbox" checked={f.required} onChange={(e) => updateField(i, "required", e.target.checked)} />
          </div>

          {/* Number config */}
          {f.type === "number" && (
            <div className="flex gap-2">
              <input type="number" placeholder="Min" className="w-full p-1.5 text-xs bg-zinc-900 border border-zinc-700 rounded"
                value={f.min ?? ""} onChange={(e) => updateField(i, "min", Number(e.target.value))} />
              <input type="number" placeholder="Max" className="w-full p-1.5 text-xs bg-zinc-900 border border-zinc-700 rounded"
                value={f.max ?? ""} onChange={(e) => updateField(i, "max", Number(e.target.value))} />
            </div>
          )}

          {/* Static select options */}
          {f.type === "select" && (
            <textarea
              className="w-full p-1.5 text-xs bg-zinc-900 border border-zinc-700 rounded"
              placeholder="Comma separated: A, B, C"
              rows={2}
              value={f.options?.join(", ") || ""}
              onChange={(e) => updateField(i, "options", e.target.value.split(",").map((o: string) => o.trim()).filter(Boolean))}
            />
          )}

          {/* Flow-driven select */}
          {f.type === "flow-select" && (
            <div className="space-y-2 bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-2">
              <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-medium">
                <GitBranch className="w-3 h-3" />
                Options from published flow
              </div>

              {/* Source flow picker */}
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Source Flow</label>
                <select
                  className="w-full p-1.5 text-xs bg-zinc-900 border border-zinc-700 rounded"
                  value={f.sourceFlowId || ""}
                  onChange={(e) => updateField(i, "sourceFlowId", e.target.value)}
                >
                  <option value="">Select a published flow…</option>
                  {publishedFlows.map((flow) => (
                    <option key={flow.id} value={flow.id}>{flow.name}</option>
                  ))}
                </select>
              </div>

              {/* Input from another field (for chained selects) */}
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">
                  Input from field <span className="text-zinc-600">(optional — for chained selects)</span>
                </label>
                <select
                  className="w-full p-1.5 text-xs bg-zinc-900 border border-zinc-700 rounded"
                  value={f.inputFrom || ""}
                  onChange={(e) => updateField(i, "inputFrom", e.target.value)}
                >
                  <option value="">None (no dependency)</option>
                  {fieldKeys.filter((fk: any) => fk.key !== f.key).map((fk: any) => (
                    <option key={fk.key} value={fk.key}>{fk.label} ({fk.key})</option>
                  ))}
                </select>
                {f.inputFrom && (
                  <p className="text-[10px] text-zinc-600 mt-1">
                    When <strong className="text-zinc-500">{f.inputFrom}</strong> changes → re-fetches options from flow with that value as input
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Delete */}
          <button onClick={() => removeField(i)} className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 transition-colors">
            <Trash2 className="w-3 h-3" /> Remove field
          </button>
        </div>
      ))}

      <button
        onClick={addField}
        className="w-full flex items-center justify-center gap-1.5 p-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-400 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Add Field
      </button>
    </div>
  );
}
