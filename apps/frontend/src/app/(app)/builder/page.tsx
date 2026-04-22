"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import WorkflowCanvas from "@/components/workflow/WorkflowCanvas";
import NodePaletteDrawer from "@/components/workflow/NodePaletteDrawer";
import SnackbarContainer from "@/components/ui/SnackbarContainer";
import { usePaletteStore } from "@/store/pellet.store";
import { useNodeListStore } from "@/store/nodeList.store";
import { useFlowStore, type OutputField, PLATFORM_ROLES } from "@/store/flow.store";
import { useProcessCategoriesStore } from "@/store/processCategories.store";
import { useSnackbarStore } from "@/store/sanckbar.store";
import { fetchFlowById } from "@/services/flows.services";
import {
  PanelLeftOpen, PanelLeftClose, Save, Upload,
  ChevronDown, GitBranch, X, Plus, Trash2, Blocks, Database,
} from "lucide-react";

const COLOR_CLASSES: Record<string, { bg: string; border: string; text: string }> = {
  "#ef4444": { bg: "bg-red-500/10",    border: "border-red-500/20",    text: "text-red-400"    },
  "#f97316": { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-400" },
  "#14b8a6": { bg: "bg-teal-500/10",   border: "border-teal-500/20",   text: "text-teal-400"   },
};
const FALLBACK_CLASSES = { bg: "bg-zinc-500/10", border: "border-zinc-500/20", text: "text-zinc-400" };

const OUTPUT_TYPES = ["string", "number", "boolean", "object", "array"] as const;

// ── Role toggle row ───────────────────────────────────────────────────────────
function RoleToggleRow({ label, selected, onChange }: {
  label: string;
  selected: string[];
  onChange: (roles: string[]) => void;
}) {
  const toggle = (role: string) =>
    onChange(selected.includes(role) ? selected.filter((r) => r !== role) : [...selected, role]);

  return (
    <div>
      <label className="text-xs font-medium text-zinc-300 block mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {PLATFORM_ROLES.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => toggle(role)}
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
              selected.includes(role)
                ? "bg-indigo-600/30 border-indigo-500 text-indigo-300"
                : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-500"
            }`}
          >
            {role}
          </button>
        ))}
      </div>
      {selected.length === 0 && (
        <p className="text-[10px] text-zinc-600 mt-1">No roles selected → all roles allowed</p>
      )}
    </div>
  );
}

// ── Publish Dialog ────────────────────────────────────────────────────────────
function PublishDialog({
  flowName,
  onConfirm,
  onClose,
  publishing,
}: {
  flowName: string;
  onConfirm: (flowType: "general" | "node" | "master", outputSchema: OutputField[], visibleToRoles: string[], runnableByRoles: string[]) => void;
  onClose: () => void;
  publishing: boolean;
}) {
  const storedFlowType = useFlowStore((s) => s.flowType);
  const storedOutputSchema = useFlowStore((s) => s.outputSchema);
  const storedVisible = useFlowStore((s) => s.visibleToRoles);
  const storedRunnable = useFlowStore((s) => s.runnableByRoles);

  const [flowType, setFlowType] = useState<"general" | "node" | "master">(storedFlowType);
  const [outputSchema, setOutputSchema] = useState<OutputField[]>(storedOutputSchema);
  const [visibleToRoles, setVisibleToRoles] = useState<string[]>(storedVisible);
  const [runnableByRoles, setRunnableByRoles] = useState<string[]>(storedRunnable);

  const addOutput = () =>
    setOutputSchema((s) => [...s, { key: "", label: "", type: "string" }]);

  const updateOutput = (i: number, field: keyof OutputField, value: string) =>
    setOutputSchema((s) => s.map((o, idx) => idx === i ? { ...o, [field]: value } : o));

  const removeOutput = (i: number) =>
    setOutputSchema((s) => s.filter((_, idx) => idx !== i));

  const FLOW_TYPES = [
    {
      id: "general" as const,
      icon: GitBranch,
      label: "General Flow",
      desc: "Standalone flow. Executed directly by workers.",
      accent: "indigo",
    },
    {
      id: "node" as const,
      icon: Blocks,
      label: "Node Flow",
      desc: "Reusable node. Appears in the palette. Can be dropped into other flows.",
      accent: "violet",
    },
    {
      id: "master" as const,
      icon: Database,
      label: "Master Flow",
      desc: "Master data flow. Role-restricted visibility and execution.",
      accent: "amber",
    },
  ];

  const accentMap: Record<string, string> = {
    indigo: "bg-indigo-600/20 border-indigo-500",
    violet: "bg-violet-600/20 border-violet-500",
    amber:  "bg-amber-600/20 border-amber-500",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-white">Publish Flow</h2>
            <p className="text-xs text-zinc-500 mt-0.5">"{flowName}"</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
          {/* Flow type */}
          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-2">Flow Type</label>
            <div className="grid grid-cols-3 gap-2">
              {FLOW_TYPES.map(({ id, icon: Icon, label, desc, accent }) => (
                <button
                  key={id}
                  onClick={() => setFlowType(id)}
                  className={`flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-colors ${
                    flowType === id
                      ? accentMap[accent]
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">{label}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Output schema — only for node flows */}
          {flowType === "node" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="text-xs font-medium text-zinc-300">Output Schema</label>
                  <p className="text-[10px] text-zinc-600 mt-0.5">Declare what this node passes to the next node</p>
                </div>
                <button onClick={addOutput} className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors">
                  <Plus className="w-3 h-3" /> Add output
                </button>
              </div>
              {outputSchema.length === 0 && (
                <div className="text-center py-4 text-zinc-600 text-xs border border-dashed border-zinc-700 rounded-lg">
                  No outputs defined — this node will pass no data forward
                </div>
              )}
              <div className="space-y-2">
                {outputSchema.map((out, i) => (
                  <div key={i} className="flex items-center gap-2 bg-zinc-800 rounded-lg p-2">
                    <input
                      type="text"
                      value={out.label}
                      onChange={(e) => updateOutput(i, "label", e.target.value)}
                      placeholder="Label"
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      value={out.key}
                      onChange={(e) => updateOutput(i, "key", e.target.value.replace(/\s/g, "_").toLowerCase())}
                      placeholder="key"
                      className="w-24 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs font-mono text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                    />
                    <select
                      value={out.type}
                      onChange={(e) => updateOutput(i, "type", e.target.value)}
                      className="w-20 bg-zinc-900 border border-zinc-700 rounded px-1 py-1 text-xs text-zinc-300 focus:outline-none"
                    >
                      {OUTPUT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button onClick={() => removeOutput(i)} className="text-zinc-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Role access — for master flows */}
          {flowType === "master" && (
            <div className="space-y-4 bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-4">
              <p className="text-[11px] text-amber-400/80 font-medium">Master Flow Access Control</p>
              <RoleToggleRow
                label="Visible to roles"
                selected={visibleToRoles}
                onChange={setVisibleToRoles}
              />
              <RoleToggleRow
                label="Can run (execute)"
                selected={runnableByRoles}
                onChange={setRunnableByRoles}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-800 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(flowType, outputSchema, visibleToRoles, runnableByRoles)}
            disabled={publishing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            {publishing ? "Publishing…" : flowType === "node" ? "Publish as Node" : flowType === "master" ? "Publish Master Flow" : "Publish Flow"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Builder Page ──────────────────────────────────────────────────────────────
export default function BuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlFlowId = searchParams.get("id");

  const { isPaletteOpen, togglePalette } = usePaletteStore();
  const loadNodes = useNodeListStore((s) => s.loadNodes);
  const nodes = useFlowStore((s) => s.nodes);
  const { categories, isLoading: catsLoading, load: loadCategories } = useProcessCategoriesStore();
  const show = useSnackbarStore((s) => s.show);
  const loadFlow = useFlowStore((s) => s.loadFlow);
  const resetFlow = useFlowStore((s) => s.resetFlow);
  const flowId = useFlowStore((s) => s.flowId);
  const saveFlow = useFlowStore((s) => s.saveFlow);
  const publishFlow = useFlowStore((s) => s.publishFlow);
  const saving = useFlowStore((s) => s.saving);
  const publishing = useFlowStore((s) => s.publishing);

  const [flowName, setFlowName] = useState("Untitled Flow");
  const [categoryValue, setCategoryValue] = useState<string>("");
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  useEffect(() => {
    if (urlFlowId) {
      fetchFlowById(urlFlowId).then((data: any) => {
        setFlowName(data.name);
        setCategoryValue(data.category ?? "");
        loadFlow({
          id: data.id,
          nodes: data.nodes ?? [],
          edges: data.edges ?? [],
          flowType: data.flowType ?? "general",
          outputSchema: data.outputSchema ?? [],
        });
      }).catch(() => show("Flow not found", "error"));
    } else {
      resetFlow();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlFlowId]);

  useEffect(() => {
    if (flowId && !urlFlowId) router.replace(`/builder?id=${flowId}`);
  }, [flowId, urlFlowId, router]);

  useEffect(() => { loadNodes(); loadCategories(); }, [loadNodes, loadCategories]);

  useEffect(() => {
    if (categories.length > 0 && !categoryValue) setCategoryValue(categories[0].value);
  }, [categories, categoryValue]);

  const activeCat = categories.find((c) => c.value === categoryValue) ?? categories[0];
  const colorClasses = activeCat ? (COLOR_CLASSES[activeCat.color] ?? FALLBACK_CLASSES) : FALLBACK_CLASSES;

  const handleSave = () => saveFlow({ name: flowName, category: categoryValue, flowType: "general", outputSchema: [], visibleToRoles: [], runnableByRoles: [] });

  const handlePublishConfirm = (flowType: "general" | "node" | "master", outputSchema: OutputField[], visibleToRoles: string[], runnableByRoles: string[]) => {
    publishFlow({ name: flowName, category: categoryValue, flowType, outputSchema, visibleToRoles, runnableByRoles });
    setShowPublishDialog(false);
  };

  return (
    <div className="h-full w-full relative overflow-hidden bg-zinc-950">

      {/* ── Toolbar ── */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-zinc-900/90 backdrop-blur-sm border border-zinc-700/60 rounded-xl px-3 py-2 shadow-xl">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 pr-2 border-r border-zinc-700">
          <GitBranch className="w-3 h-3" />
          <span>{nodes.length} node{nodes.length !== 1 ? "s" : ""}</span>
        </div>

        <input
          value={flowName}
          onChange={(e) => setFlowName(e.target.value)}
          className="bg-transparent text-sm font-medium text-white w-44 focus:outline-none placeholder-zinc-500 border-b border-transparent focus:border-zinc-600 transition-colors"
          placeholder="Flow name…"
        />

        {/* Category picker */}
        <div className="relative">
          <button
            onClick={() => setShowCategoryMenu((v) => !v)}
            disabled={catsLoading || !activeCat}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${colorClasses.bg} border ${colorClasses.border} text-xs font-medium ${colorClasses.text} transition-colors hover:opacity-80 disabled:opacity-40`}
          >
            {activeCat && <activeCat.icon className="w-3 h-3" />}
            {activeCat?.label ?? "…"}
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
          {showCategoryMenu && (
            <div className="absolute top-full mt-1.5 left-0 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-1 w-44 z-30">
              {categories.map((cat) => {
                const cls = COLOR_CLASSES[cat.color] ?? FALLBACK_CLASSES;
                return (
                  <button
                    key={cat.value}
                    onClick={() => { setCategoryValue(cat.value); setShowCategoryMenu(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-zinc-800 transition-colors ${cls.text}`}
                  >
                    <cat.icon className="w-3.5 h-3.5 shrink-0" />
                    <div className="text-left">
                      <div>{cat.label}</div>
                      <div className="text-zinc-600 text-[10px] font-normal truncate">{cat.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-zinc-700 mx-1" />

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white disabled:opacity-50 transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? "Saving…" : "Save"}
        </button>

        <button
          onClick={() => setShowPublishDialog(true)}
          disabled={publishing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          {publishing ? "Publishing…" : "Publish"}
        </button>
      </div>

      {/* Palette toggle */}
      <button
        onClick={togglePalette}
        className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-zinc-900/90 backdrop-blur-sm border border-zinc-700/60 hover:bg-zinc-800 text-zinc-300 hover:text-white px-3 py-2 rounded-xl text-xs font-medium transition-colors shadow-lg"
      >
        {isPaletteOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
        Nodes
      </button>

      <NodePaletteDrawer />
      <WorkflowCanvas />
      <SnackbarContainer />

      {/* Publish dialog */}
      {showPublishDialog && (
        <PublishDialog
          flowName={flowName}
          onConfirm={handlePublishConfirm}
          onClose={() => setShowPublishDialog(false)}
          publishing={publishing}
        />
      )}
    </div>
  );
}
