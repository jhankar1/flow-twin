import { create } from "zustand";
import { fetchNodeList } from "@/services/node.services";

export type NodeMeta = {
  Nodeid: string;
  label: string;
  category: string;
  icon: string;
  color: string;
};

type State = {
  nodeList: NodeMeta[];
  isLoading: boolean;

  loadNodes: () => Promise<void>;
};

export const useNodeListStore = create<State>((set, get) => ({
  nodeList: [],
  isLoading: false,

  loadNodes: async () => {
    // 🔥 prevent duplicate calls
    if (get().nodeList.length > 0) return;

    set({ isLoading: true });

    try {
      const nodes = await fetchNodeList();
      set({ nodeList: nodes });
    } catch (e) {
      console.error("Failed to load nodes", e);
    } finally {
      set({ isLoading: false });
    }
  },
}));