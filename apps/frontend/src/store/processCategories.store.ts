import { create } from "zustand";
import { Factory, ShoppingCart, Briefcase, LucideIcon } from "lucide-react";
import { fetchProcessCategories } from "@/services/processCategories.services";

export type ProcessCategory = {
  value: string;
  label: string;
  description: string;
  color: string;
  iconName: string;
  lotPrefix: string;
};

// Maps iconName string from API → actual Lucide component
const ICON_MAP: Record<string, LucideIcon> = {
  Factory,
  ShoppingCart,
  Briefcase,
};

export type ProcessCategoryResolved = ProcessCategory & {
  icon: LucideIcon;
};

type ProcessCategoriesState = {
  categories: ProcessCategoryResolved[];
  isLoading: boolean;
  load: () => Promise<void>;
};

export const useProcessCategoriesStore = create<ProcessCategoriesState>((set, get) => ({
  categories: [],
  isLoading: false,

  load: async () => {
    if (get().categories.length > 0) return; // already loaded
    set({ isLoading: true });
    try {
      const data = await fetchProcessCategories();
      const resolved: ProcessCategoryResolved[] = data.map((cat) => ({
        ...cat,
        icon: ICON_MAP[cat.iconName] ?? Factory,
      }));
      set({ categories: resolved });
    } finally {
      set({ isLoading: false });
    }
  },
}));
