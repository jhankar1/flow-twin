import { create } from "zustand";

type PaletteState = {
  isPaletteOpen: boolean;

  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;
};

export const usePaletteStore = create<PaletteState>((set) => ({
  isPaletteOpen: true,

  openPalette: () => set({ isPaletteOpen: true }),

  closePalette: () => set({ isPaletteOpen: false }),

  togglePalette: () =>
    set((state) => ({
      isPaletteOpen: !state.isPaletteOpen,
    })),
}));