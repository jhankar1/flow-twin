"use client";

import React from "react";
import { NodeMeta } from "@/store/nodeList.store";
import { CATEGORY_ICONS } from "@/lib/nodesIcon";
import { CATEGORY_COLORS } from "@/lib/nodeColor";
import { usePaletteStore } from "@/store/pellet.store";

type Props = {
  node: NodeMeta;
};

const NodeItem = React.memo(({ node }: Props) => {
  const Icon = CATEGORY_ICONS[node.category];
  const accentColor = CATEGORY_COLORS[node.category] || "#52525b";
  const closePalette = usePaletteStore((s) => s.closePalette);

  const onDragStart = (event: React.DragEvent) => {
    closePalette();
    event.dataTransfer.setData("application/reactflow", JSON.stringify(node));
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="
        group flex items-center gap-3
        px-3 py-2
        rounded-xl
        border border-transparent
        bg-zinc-900/50
        hover:bg-zinc-800
        hover:border-zinc-700
        active:scale-[0.98]
        cursor-grab active:cursor-grabbing
        transition-all duration-150
      "
    >
      {/* Colored icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition"
        style={{
          backgroundColor: accentColor + "18",
          border: `1px solid ${accentColor}33`,
        }}
      >
        {Icon && <Icon className="w-3.5 h-3.5" style={{ color: accentColor }} />}
      </div>

      {/* Label + hint */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-zinc-200 group-hover:text-white truncate">
          {node.label}
        </div>
      </div>

      {/* Drag hint */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex flex-col gap-0.5">
          <div className="w-3 border-t border-zinc-600" />
          <div className="w-3 border-t border-zinc-600" />
          <div className="w-3 border-t border-zinc-600" />
        </div>
      </div>
    </div>
  );
});

NodeItem.displayName = "NodeItem";
export default NodeItem;
