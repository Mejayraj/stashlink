import { create } from "zustand";

// The signed-in user's email, set by the auth gate after each session check.
export const useAuthStore = create<{ email: string | null; setEmail: (email: string | null) => void }>(
  (set) => ({ email: null, setEmail: (email) => set({ email }) }),
);
