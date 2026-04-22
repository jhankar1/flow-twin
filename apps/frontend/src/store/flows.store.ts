import { create } from "zustand";
import { fetchFlowList } from "@/services/flows.services";

export type FlowSummary = {
  id: string;
  name: string;
  category: string;
  status: "draft" | "published";
  flowType: "general" | "node" | "master";
  visibleToRoles: string[];
  runnableByRoles: string[];
  nodeCount: number;
  savedAt: string;
  publishedAt: string | null;
};

type FlowsState = {
  flows: FlowSummary[];
  isLoading: boolean;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
};

export const useFlowsStore = create<FlowsState>((set) => ({
  flows: [],
  isLoading: false,

  // Load once — no-ops if already loaded
  load: async () => {
    set((s) => {
      if (s.flows.length > 0) return s;
      return { isLoading: true };
    });
    const flows = await fetchFlowList();
    set({ flows, isLoading: false });
  },

  // Force re-fetch (e.g. after save/publish)
  refresh: async () => {
    set({ isLoading: true });
    const flows = await fetchFlowList();
    set({ flows, isLoading: false });
  },
}));
