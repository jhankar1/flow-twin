import { NodeProps, Handle, Position } from "reactflow";
import { X } from "lucide-react";
import { useFlowStore } from "@/store/flow.store";
import { CATEGORY_ICONS } from "@/lib/nodesIcon";
import { CATEGORY_COLORS } from "@/lib/nodeColor";

const NODE_TYPE_LABEL: Record<string, string> = {
  trigger: "Trigger",
  process: "Process",
  branch: "Branch",
  data: "Data",
  end: "End",
  action_email: "Action",
  action_db_write: "Action",
  action_rest: "Action",
  action_mqtt: "Action",
  action_webhook: "Action",
  customNode: "Node",
};

export default function CustomNode({ id, data }: NodeProps<any>) {
  const deleteNode = useFlowStore((s) => s.deleteNode);

  if (data.loading || !data.definition) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 min-w-[180px]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-zinc-700 animate-pulse" />
          <span className="text-xs text-zinc-500">Loading…</span>
        </div>
      </div>
    );
  }

  const def = data.definition;
  const category: string = data.meta?.category || "";
  const accentColor: string = CATEGORY_COLORS[category] || "#52525b";
  const Icon = CATEGORY_ICONS[category] || null;
  const typeLabel = NODE_TYPE_LABEL[def.type] || NODE_TYPE_LABEL[data.meta?.type] || "Node";

  return (
    <div
      className="relative bg-zinc-900 rounded-xl border border-zinc-700/60 min-w-[190px] max-w-[220px] overflow-hidden shadow-lg"
      style={{ boxShadow: `0 0 0 1px ${accentColor}22, 0 4px 16px rgba(0,0,0,0.4)` }}
    >
      {/* Category color top bar */}
      <div className="h-0.5 w-full" style={{ backgroundColor: accentColor }} />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-2">
        {Icon && (
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{ backgroundColor: accentColor + "22" }}
          >
            <Icon className="w-3 h-3" style={{ color: accentColor }} />
          </div>
        )}

        <span className="text-xs font-semibold text-white flex-1 leading-tight pr-1 truncate">
          {def.label}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteNode(id);
          }}
          className="w-5 h-5 rounded-md flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition-colors shrink-0"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Type badge */}
      <div className="px-3 pb-2.5 flex items-center gap-1.5">
        <span
          className="text-[10px] font-medium px-1.5 py-0.5 rounded"
          style={{ backgroundColor: accentColor + "18", color: accentColor }}
        >
          {typeLabel}
        </span>
        {def.outputs?.length > 0 && (
          <span className="text-[10px] text-zinc-600">
            {def.inputs?.length || 0} in · {def.outputs?.length || 0} out
          </span>
        )}
      </div>

      {/* INPUT HANDLES */}
      {def.inputs?.map((input: any, i: number) => (
        <Handle
          key={input.id}
          type="target"
          position={Position.Left}
          id={input.id}
          isConnectable
          style={{
            top: 44 + i * 20,
            left: -5,
            width: 10,
            height: 10,
            borderRadius: 3,
            background: "#3f3f46",
            border: `2px solid ${accentColor}66`,
          }}
        />
      ))}

      {/* OUTPUT HANDLES */}
      {def.outputs?.map((output: any, i: number) => (
        <Handle
          key={output.id}
          type="source"
          position={Position.Right}
          id={output.id}
          isConnectable
          style={{
            top: 44 + i * 20,
            right: -5,
            width: 10,
            height: 10,
            borderRadius: 3,
            background: accentColor,
            border: "2px solid #18181b",
          }}
        />
      ))}
    </div>
  );
}
