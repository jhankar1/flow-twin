"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useFlowStore } from "@/store/flow.store";
import NodeConfigForm from "@/components/ui/nodeConfigForm";
import { CATEGORY_ICONS } from "@/lib/nodesIcon";
import { CATEGORY_COLORS } from "@/lib/nodeColor";
import { Info, Settings2, Layers } from "lucide-react";

type Tab = "config" | "info";

export default function NodeConfigDrawer() {
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId);
  const nodes = useFlowStore((s) => s.nodes);
  const setSelectedNode = useFlowStore((s) => s.setSelectedNode);

  const [tab, setTab] = useState<Tab>("config");

  const node = nodes.find((n) => n.id === selectedNodeId);

  const category: string = node?.data?.meta?.category || "";
  const accentColor = CATEGORY_COLORS[category] || "#52525b";
  const Icon = CATEGORY_ICONS[category] || Layers;
  const def = node?.data?.definition;

  return (
    <Sheet open={!!node} onOpenChange={() => setSelectedNode(null)}>
      <SheetContent className="w-[320px] p-0 bg-zinc-950 border-l border-zinc-800 flex flex-col">

        {/* ── Node header ── */}
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: accentColor + "20", border: `1px solid ${accentColor}33` }}
            >
              <Icon className="w-4 h-4" style={{ color: accentColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-sm font-semibold text-white leading-tight truncate">
                {node?.data?.label || "Node Settings"}
              </SheetTitle>
              <SheetDescription className="text-xs mt-0.5" style={{ color: accentColor }}>
                {category || "Configure node"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* ── Tabs ── */}
        <div className="flex border-b border-zinc-800 shrink-0">
          {(["config", "info"] as Tab[]).map((t) => {
            const TabIcon = t === "config" ? Settings2 : Info;
            const label = t === "config" ? "Properties" : "Info";
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex-1 justify-center ${
                  tab === t
                    ? "border-indigo-500 text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <TabIcon className="w-3 h-3" />
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 overflow-y-auto">
          {!node ? null : node.data.loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-zinc-700 border-t-indigo-500 animate-spin" />
              <span className="text-xs text-zinc-500">Loading configuration…</span>
            </div>
          ) : (
            <>
              {tab === "config" && (
                <div className="p-4">
                  <NodeConfigForm node={node} />
                </div>
              )}

              {tab === "info" && (
                <div className="p-4 space-y-4">
                  {/* Node description */}
                  {def?.info && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">About this node</div>
                      <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                        {def.info}
                      </p>
                    </div>
                  )}

                  {/* Inputs */}
                  {def?.inputs?.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Inputs</div>
                      <div className="space-y-1">
                        {def.inputs.map((inp: any) => (
                          <div key={inp.id} className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                            <div className="w-2 h-2 rounded-sm bg-zinc-600" />
                            <span className="text-zinc-300">{inp.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Outputs */}
                  {def?.outputs?.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Outputs</div>
                      <div className="space-y-1">
                        {def.outputs.map((out: any) => (
                          <div key={out.id} className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                            <div
                              className="w-2 h-2 rounded-sm shrink-0"
                              style={{ backgroundColor: accentColor }}
                            />
                            <span className="text-zinc-300">{out.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Node ID */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Node ID</div>
                    <div className="text-xs font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 truncate">
                      {node.id}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
