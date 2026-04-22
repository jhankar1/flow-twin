import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  EdgeProps,
} from "reactflow";

import { X } from "lucide-react";
import { useFlowStore } from "@/store/flow.store";

export default function EditEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  } = props;

  const deleteEdge = useFlowStore((s) => s.deleteEdge);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} />

      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
        >
          <button
            onClick={() => deleteEdge(id)}
            className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-red-400 hover:border-red-500/50 hover:bg-zinc-800 transition-colors shadow"
          >
            <X size={10} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}