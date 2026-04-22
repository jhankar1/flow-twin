import { create } from "zustand";
import { fetchNodeConfig } from "@/services/node.services";
import { useSnackbarStore } from "@/store/sanckbar.store";
import { useFlowsStore } from "@/store/flows.store";
import { CATEGORY_ICONS } from "@/lib/nodesIcon";
import { CATEGORY_COLORS } from "@/lib/nodeColor"

const show = useSnackbarStore.getState().show;
import {
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Connection,
} from "reactflow";
type FlowStatus = "draft" | "published";

export interface OutputField {
  key: string;
  label: string;
  type: "string" | "number" | "boolean" | "object" | "array";
}

export const PLATFORM_ROLES = [
  "Designer", "Worker", "QA Supervisor", "Manager", "IIoT Admin", "Org Admin",
] as const;

type FlowMeta = {
  name: string;
  category: string;
  flowType: "general" | "node" | "master";
  outputSchema: OutputField[];
  visibleToRoles: string[];
  runnableByRoles: string[];
};
type NodeData = {
  label: string;
  meta: any;
  definition?: any;
  config?: any;
  loading?: boolean;
};

type FlowState = {
  nodes: Node<NodeData>[];
  edges: Edge[];

  selectedNodeId: string | null;
  flowId: string | null;
  flowType: "general" | "node" | "master";
  outputSchema: OutputField[];
  visibleToRoles: string[];
  runnableByRoles: string[];
  saving: boolean;
  publishing: boolean;

  postFlow: (status: FlowStatus, meta: FlowMeta) => Promise<any>;
  saveFlow: (meta: FlowMeta) => Promise<void>;
  publishFlow: (meta: FlowMeta) => Promise<void>;

  addNode: (nodeMeta: any, position: { x: number; y: number }) => void;
  deleteNode: (nodeId: string) => void;

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  deleteEdge: (edgeId: string) => void;
  updateEdgeLabel: (edgeId: string, label: string) => void;

  setSelectedNode: (id: string | null) => void;
  updateNodeConfig: (nodeId: string, key: string, value: any) => void;

  loadFlow: (flow: { id: string; nodes: Node<NodeData>[]; edges: Edge[]; flowType?: string; outputSchema?: OutputField[]; visibleToRoles?: string[]; runnableByRoles?: string[] }) => void;
  resetFlow: () => void;
};

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  flowId: null,
  flowType: "general",
  outputSchema: [],
  visibleToRoles: [],
  runnableByRoles: [],
  saving: false,
  publishing: false,

  // ── API CALL (shared) ──
  postFlow: async (status: "draft" | "published", meta: FlowMeta) => {
    const { nodes, edges, flowId } = get();

    // Strip definition — it's fetched fresh from /api/nodes on load.
    // Only persist what's needed to restore the canvas.
    const minimalNodes = nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: {
        label: n.data.label,
        meta: n.data.meta,     // Nodeid + category → enough to re-fetch definition
        config: n.data.config, // user's field values
      },
    }));

    const minimalEdges = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      type: e.type,
      data: e.data,
    }));

    const { apiFetch } = await import("@/lib/api");
    const res = await apiFetch("/flows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: flowId,
        name: meta.name,
        category: meta.category,
        flowType: meta.flowType,
        outputSchema: meta.outputSchema,
        visibleToRoles: meta.visibleToRoles,
        runnableByRoles: meta.runnableByRoles,
        status,
        nodes: minimalNodes,
        edges: minimalEdges,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const detail = data.issues
        ? data.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join('; ')
        : null;
      throw new Error(detail || data.error || "Failed");
    }

    set({ flowId: data.id }); // 🔥 persist ID
    return data;
  },

  // ── SAVE ──
  saveFlow: async (meta) => {
    try {
      set({ saving: true });

      await get().postFlow("draft", meta);
      await useFlowsStore.getState().refresh();
      show("Flow saved as draft", "success");
    } catch (err: any) {
      show(err.message, "error");
    } finally {
      set({ saving: false });
    }
  },

  // ── PUBLISH ──
  publishFlow: async (meta) => {
    try {
      set({ publishing: true });

      await get().postFlow("published", meta);
      await useFlowsStore.getState().refresh();
      show("Flow published", "success");
    } catch (err: any) {
      show(err.message, "error");
    } finally {
      set({ publishing: false });
    }
  },

  // 🔥 ADD NODE (DROP)
  addNode: async (nodeMeta, position) => {
    const id = crypto.randomUUID();

    // 1. Add node + open drawer immediately
    set((state) => ({
      nodes: [
        ...state.nodes,
        {
          id,
          type: "custom",
          position,
          data: {
            label: nodeMeta.label,
            definition: null,
            config: {},
            fields: [], // ✅ ensures array
            meta: nodeMeta,
            loading: true,
            color: CATEGORY_COLORS[nodeMeta.category] || "#52525b",
            icon: CATEGORY_ICONS[nodeMeta.category] || null, // ✅
          },
        },
      ],
      selectedNodeId: id, // 🔥 open drawer instantly
    }));

    try {
      // 2. API CALL
      const def = await fetchNodeConfig(nodeMeta.Nodeid);

      // 3. Update node
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === id
            ? {
              ...n,
              data: {
                ...n.data,
                definition: def,
                config: def.configValues || {},
                fields: def.configValues?.fields || [], // ✅ ensures array
                loading: false,
              },
            }
            : n
        ),
      }));
    } catch (err) {
      console.error(err);
    }
  },

  deleteNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      ),
      selectedNodeId:
        state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    })),

  onNodesChange: (changes) =>
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    })),

  onEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    })),

  onConnect: (connection) => {
    const state = get();

    const { source, target } = connection;

    if (!source || !target) return;

    // ❌ block self connection
    if (source === target) {
      show("self connection blocked", "error");
      return;
    }

    // 🔥 CYCLE CHECK
    // if target can reach source → cycle
    const createsCycle = hasPath(state.edges, target, source);

    if (createsCycle) {
      show("Cycle not allowed!", "error");
      return;

    }

    // existing duplicate check
    const exists = state.edges.some(
      (e) =>
        e.target === connection.target &&
        e.targetHandle === connection.targetHandle
    );

    if (exists) return;

    // ✅ allow connection
    set({
      edges: addEdge(
        {
          ...connection,
          type: "editable",
          data: { label: connection.sourceHandle || "Flow" },
        },
        state.edges
      ),
    });
  },

  deleteEdge: (edgeId) =>
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== edgeId),
    })),

  updateEdgeLabel: (edgeId, label) =>
    set((state) => ({
      edges: state.edges.map((e) =>
        e.id === edgeId ? { ...e, data: { ...e.data, label } } : e
      ),
    })),

  setSelectedNode: (id) => set({ selectedNodeId: id }),

  loadFlow: (flow) =>
    set({
      flowId: flow.id,
      nodes: flow.nodes,
      edges: flow.edges,
      flowType: (flow.flowType as any) ?? 'general',
      outputSchema: flow.outputSchema ?? [],
      visibleToRoles: (flow as any).visibleToRoles ?? [],
      runnableByRoles: (flow as any).runnableByRoles ?? [],
      selectedNodeId: null,
    }),

  resetFlow: () =>
    set({ flowId: null, nodes: [], edges: [], flowType: 'general', outputSchema: [], visibleToRoles: [], runnableByRoles: [], selectedNodeId: null }),

  // 🔥 UPDATE CONFIG
  updateNodeConfig: (nodeId, key, value) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? {
            ...n,
            data: {
              ...n.data,
              config: {
                ...n.data.config,
                [key]: value,
              },
            },
          }
          : n
      ),
    })),

}));
function hasPath(edges: Edge[], from: string, to: string): boolean {
  const visited = new Set<string>();

  function dfs(node: string): boolean {
    if (node === to) return true;
    if (visited.has(node)) return false;

    visited.add(node);

    const next = edges
      .filter((e) => e.source === node)
      .map((e) => e.target);

    return next.some(dfs);
  }

  return dfs(from);
}