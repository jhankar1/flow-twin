import { create } from "zustand";

type SnackbarType = "success" | "error" | "info";

type SnackbarItem = {
  id: string;
  message: string;
  type: SnackbarType;
};

type SnackbarState = {
  snackbars: SnackbarItem[];

  show: (message: string, type?: SnackbarType) => void;
  remove: (id: string) => void;
};

export const useSnackbarStore = create<SnackbarState>((set) => ({
  snackbars: [],

  show: (message, type = "info") => {
    const id = crypto.randomUUID();

    const snackbar = { id, message, type };

    set((state) => ({
      snackbars: [...state.snackbars, snackbar],
    }));

    // 🔥 auto remove after 3s
    setTimeout(() => {
      set((state) => ({
        snackbars: state.snackbars.filter((s) => s.id !== id),
      }));
    }, 3000);
  },

  remove: (id) =>
    set((state) => ({
      snackbars: state.snackbars.filter((s) => s.id !== id),
    })),
}));