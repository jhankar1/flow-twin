"use client";

import { useFlowStore } from "@/store/flow.store";
import FieldBuilder from "./FieldBuilder";
import NodePermissions from "./NodePermissions";

export default function NodeConfigForm({ node }: any) {
  const updateNodeConfig = useFlowStore((s) => s.updateNodeConfig);

  const schema = node.data.definition?._schema || {};
  const values = node.data.config || {};

  return (
    <div className="mt-4 space-y-3">
      {Object.entries(schema).map(([key, field]: any) => {

        // ─────────────────────────────
        // TEXT INPUT
        // ─────────────────────────────
        if (field.component === "Text") {
          return (
            <div key={key}>
              <label className="text-xs">{field.label}</label>
              <input
                className="w-full mt-1 p-1 bg-zinc-800 border border-zinc-700 rounded"
                placeholder={field.placeholder}
                value={values[key] || ""}
                onChange={(e) =>
                  updateNodeConfig(node.id, key, e.target.value)
                }
              />
            </div>
          );
        }

        // ─────────────────────────────
        // TEXTAREA
        // ─────────────────────────────
        if (field.component === "Textarea") {
          return (
            <div key={key}>
              <label className="text-xs">{field.label}</label>
              <textarea
                className="w-full mt-1 p-1 bg-zinc-800 border border-zinc-700 rounded"
                placeholder={field.placeholder}
                value={values[key] || ""}
                onChange={(e) =>
                  updateNodeConfig(node.id, key, e.target.value)
                }
              />
            </div>
          );
        }

        // ─────────────────────────────
        // SELECT
        // ─────────────────────────────
        if (field.component === "Select") {
          return (
            <div key={key}>
              <label className="text-xs">{field.label}</label>
              <select
                className="w-full mt-1 p-1 bg-zinc-800 border border-zinc-700 rounded"
                value={values[key] || ""}
                onChange={(e) =>
                  updateNodeConfig(node.id, key, e.target.value)
                }
              >
                {field.options?.map((opt: string) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        // ─────────────────────────────
        // TOGGLE (BOOLEAN)
        // ─────────────────────────────
        if (field.component === "Toggle") {
          return (
            <div key={key} className="flex items-center justify-between">
              <label className="text-xs">{field.label}</label>
              <input
                type="checkbox"
                checked={values[key] ?? false}
                onChange={(e) =>
                  updateNodeConfig(node.id, key, e.target.checked)
                }
              />
            </div>
          );
        }

        // ─────────────────────────────
        // MULTI SELECT
        // ─────────────────────────────
        if (field.component === "MultiSelect") {
          return (
            <div key={key}>
              <label className="text-xs">{field.label}</label>
              <select
                multiple
                className="w-full mt-1 p-1 bg-zinc-800 border border-zinc-700 rounded"
                value={values[key] || []}
                onChange={(e) => {
                  const selected = Array.from(
                    e.target.selectedOptions
                  ).map((o: any) => o.value);

                  updateNodeConfig(node.id, key, selected);
                }}
              >
                {field.options?.map((opt: string) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        // ─────────────────────────────
        // CODE EDITOR (fallback)
        // ─────────────────────────────
        if (field.component === "CodeEditor") {
          return (
            <div key={key}>
              <label className="text-xs">{field.label}</label>
              <textarea
                className="w-full mt-1 p-2 font-mono text-xs bg-zinc-800 border border-zinc-700 rounded"
                rows={6}
                placeholder={field.placeholder}
                value={values[key] || ""}
                onChange={(e) =>
                  updateNodeConfig(node.id, key, e.target.value)
                }
              />
            </div>
          );
        }

        // ─────────────────────────────
        // FIELD BUILDER (stub)
        // ─────────────────────────────
        if (field.component === "FieldBuilder") {
          return (
            <FieldBuilder
              key={key}
              node={node}
              fieldKey={key}
            />
          );
        }

        // ─────────────────────────────
        // QA PARAM BUILDER (stub)
        // ─────────────────────────────
        if (field.component === "QAParameterBuilder") {
          return (
            <div key={key} className="text-xs text-yellow-400">
              ⚠️ QA Parameter Builder not implemented yet
            </div>
          );
        }

        // ─────────────────────────────
        // FALLBACK
        // ─────────────────────────────
        return (
          <div key={key} className="text-xs text-red-400">
            Unsupported component: {field.component}
          </div>
        );
      })}

      {/* ── Node Permissions — always shown at the bottom ── */}
      <NodePermissions node={node} />
    </div>
  );
}