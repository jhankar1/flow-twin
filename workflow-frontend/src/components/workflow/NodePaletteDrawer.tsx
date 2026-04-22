"use client";

import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { usePaletteStore } from "@/store/pellet.store";
import { useNodeListStore } from "@/store/nodeList.store";
import { useFlowStore } from "@/store/flow.store";
import { CATEGORY_ICONS } from "@/lib/nodesIcon";
import { CATEGORY_COLORS } from "@/lib/nodeColor";
import NodeItem from "./NodeItem";
import { apiFetch } from "@/lib/api";
import { Blocks, GitBranch } from "lucide-react";

const CATEGORY_ORDER = [
  "FlowControl", "Forms", "AI", "Industrial",
  "Data", "Communication", "CustomerProcess", "BusinessProcess", "Reports",
];

const CATEGORY_LABELS: Record<string, string> = {
  FlowControl: "Flow Control",
  CustomerProcess: "Customer",
  BusinessProcess: "Business",
  Industrial: "Industrial",
};

interface FlowNode {
  id: string;
  name: string;
  category: string;
  outputSchema: { key: string; label: string; type: string }[];
  publishedAt: string;
}

// ── Flow node item — draggable into canvas ────────────────────────────────────
function FlowNodeItem({ flow }: { flow: FlowNode }) {
  const addNode = useFlowStore((s) => s.addNode);

  const handleDrop = () => {
    addNode(
      {
        Nodeid: `flow-node::${flow.id}`,
        label: flow.name,
        category: "FlowNodes",
        description: `Flow node: ${flow.name}`,
        isFlowNode: true,
        sourceFlowId: flow.id,
        outputSchema: flow.outputSchema,
      },
      { x: 200, y: 200 }
    );
  };

  return (
    <div
      draggable
      onDragEnd={handleDrop}
      onClick={handleDrop}
      className="flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-zinc-800 cursor-grab active:cursor-grabbing transition-colors group"
    >
      <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-violet-500/20 mt-0.5">
        <Blocks className="w-3.5 h-3.5 text-violet-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-zinc-300 group-hover:text-white truncate">{flow.name}</div>
        {flow.outputSchema.length > 0 && (
          <div className="text-[10px] text-zinc-600 mt-0.5 truncate">
            outputs: {flow.outputSchema.map((o) => o.key).join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}

export default function NodePaletteDrawer() {
  const { isPaletteOpen, closePalette } = usePaletteStore();
  const nodeList = useNodeListStore((s) => s.nodeList);
  const [flowNodes, setFlowNodes] = useState<FlowNode[]>([]);

  // Fetch published node flows whenever palette opens
  useEffect(() => {
    if (!isPaletteOpen) return;
    apiFetch("/flows/node-palette")
      .then((r) => r.json())
      .then((data) => setFlowNodes(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [isPaletteOpen]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof nodeList> = {};
    for (const n of nodeList) {
      const key = n.category || "Other";
      if (!map[key]) map[key] = [];
      map[key].push(n);
    }
    return Object.fromEntries(
      Object.entries(map).sort(([a], [b]) => {
        const ai = CATEGORY_ORDER.indexOf(a);
        const bi = CATEGORY_ORDER.indexOf(b);
        if (ai === -1 && bi === -1) return a.localeCompare(b);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      })
    );
  }, [nodeList]);

  return (
    <Sheet open={isPaletteOpen} onOpenChange={closePalette}>
      <SheetContent
        side="left"
        className="w-64 p-0 pointer-events-auto flex flex-col h-full bg-zinc-950 border-r border-zinc-800"
      >
        <SheetHeader className="px-4 py-3 border-b border-zinc-800 shrink-0">
          <SheetTitle className="text-sm font-semibold text-zinc-200">Node Palette</SheetTitle>
          <p className="text-xs text-zinc-500 mt-0.5">
            {nodeList.length} system nodes · {flowNodes.length} flow nodes
          </p>
        </SheetHeader>

        <div className="pointer-events-auto flex-1 overflow-y-auto">
          <Accordion type="multiple" defaultValue={["FlowNodes", ...CATEGORY_ORDER.slice(0, 3)]} className="w-full">

            {/* ── Flow Nodes section (live from DB) ── */}
            <AccordionItem value="FlowNodes" className="border-b border-zinc-800/60">
              <AccordionTrigger className="px-3 py-2.5 hover:bg-zinc-900 hover:no-underline group [&>svg]:text-zinc-600">
                <div className="flex items-center gap-2.5 flex-1">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-violet-500/20">
                    <Blocks className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <span className="text-xs font-semibold text-violet-300 group-hover:text-white transition-colors">
                    Flow Nodes
                  </span>
                  <span className="text-[10px] text-zinc-600 ml-auto mr-2">{flowNodes.length}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-2 px-2">
                {flowNodes.length === 0 ? (
                  <div className="px-2 py-3 text-[11px] text-zinc-600 text-center">
                    No node flows published yet.<br />
                    <span className="text-zinc-700">Publish a flow as "Node Flow" to see it here.</span>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {flowNodes.map((flow) => (
                      <FlowNodeItem key={flow.id} flow={flow} />
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* ── System node categories ── */}
            {Object.entries(grouped).map(([category, nodes]) => {
              const Icon = CATEGORY_ICONS[category];
              const color = CATEGORY_COLORS[category] || "#52525b";
              const label = CATEGORY_LABELS[category] || category;
              return (
                <AccordionItem key={category} value={category} className="border-b border-zinc-800/60">
                  <AccordionTrigger className="px-3 py-2.5 hover:bg-zinc-900 hover:no-underline group [&>svg]:text-zinc-600">
                    <div className="flex items-center gap-2.5 flex-1">
                      {Icon && (
                        <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: color + "20" }}>
                          <Icon className="w-3.5 h-3.5" style={{ color }} />
                        </div>
                      )}
                      <span className="text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors">{label}</span>
                      <span className="text-[10px] text-zinc-600 ml-auto mr-2">{nodes.length}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-2 px-2">
                    <div className="space-y-0.5">
                      {nodes.map((node) => (
                        <NodeItem key={node.Nodeid} node={node} />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </SheetContent>
    </Sheet>
  );
}
