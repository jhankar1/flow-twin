import { create } from "zustand";

/* ------------------ TYPES ------------------ */

// lightweight (sidebar)
export type NodeMeta = {
  Nodeid: string;
  label: string;
  category: string;
  icon: string;
  color: string;
};

// full config (lazy loaded)
export type NodeTemplate = {
  Nodeid: string; // ✅ IMPORTANT (not type)

  type: string;
  inputs?: any[];
  outputs?: any[];

  info?: string;

  configValues?: Record<string, any>;
  _schema?: Record<string, any>;
};

/* ------------------ STATE ------------------ */

type State = {
  // sidebar data
  nodeList: NodeMeta[];

  // cached full templates
  templateMap: Record<string, NodeTemplate>;

  // actions
  setNodeList: (nodes: NodeMeta[]) => void;
  setTemplate: (id: string, template: NodeTemplate) => void;
};

/* ------------------ STORE ------------------ */

export const useNodeTemplateStore = create<State>((set) => ({
  nodeList: [],
  templateMap: {},

  setNodeList: (nodes) =>
    set(() => ({
      nodeList: nodes,
    })),

  setTemplate: (id, template) =>
    set((state) => ({
      templateMap: {
        ...state.templateMap,
        [id]: template,
      },
    })),
}));