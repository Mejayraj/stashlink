import { create } from "zustand";

import type { ViewSelection } from "./types";

interface UIState {
  view: ViewSelection;
  query: string;
  drawerOpen: boolean;
  moveTargetId: string | null;
  setView: (view: ViewSelection) => void;
  setQuery: (query: string) => void;
  setDrawerOpen: (open: boolean) => void;
  setMoveTargetId: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  view: { kind: "everything" },
  query: "",
  drawerOpen: false,
  moveTargetId: null,
  setView: (view) => set({ view }),
  setQuery: (query) => set({ query }),
  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
  setMoveTargetId: (moveTargetId) => set({ moveTargetId }),
}));
