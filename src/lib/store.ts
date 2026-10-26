import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

import { STORAGE_KEY } from "./constants";
import { newId } from "./id";
import { getSeed } from "./seed";
import type { Link, Topic } from "./types";

export interface NewLinkInput {
  url: string;
  title: string;
  domain: string;
  imageUrl?: string | null;
  note?: string;
  topicId?: string | null;
  keywords?: string[];
}

interface DataState {
  topics: Topic[];
  links: Link[];
  createTopic: (name: string, parentId?: string | null) => Topic;
  renameTopic: (id: string, name: string) => void;
  deleteTopic: (id: string) => void;
  createLink: (input: NewLinkInput) => Link;
  updateLink: (id: string, patch: Partial<Omit<Link, "id">>) => void;
  deleteLink: (id: string) => Link | null;
  restoreLink: (link: Link) => void;
}

// Guards SSR (no window) and private-mode browsers (storage may throw).
const safeStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // Storage full or blocked; Phase 1 keeps working in memory.
    }
  },
  removeItem: (name) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(name);
    } catch {
      // Ignore.
    }
  },
};

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      topics: getSeed().topics,
      links: getSeed().links,

      createTopic: (name, parentId = null) => {
        const topic: Topic = { id: newId("topic"), name: name.trim(), parentId, createdAt: Date.now() };
        set((s) => ({ topics: [...s.topics, topic] }));
        return topic;
      },

      renameTopic: (id, name) =>
        set((s) => ({
          topics: s.topics.map((t) => (t.id === id ? { ...t, name: name.trim() } : t)),
        })),

      deleteTopic: (id) =>
        set((s) => {
          const doomed = new Set([id, ...s.topics.filter((t) => t.parentId === id).map((t) => t.id)]);
          return {
            topics: s.topics.filter((t) => !doomed.has(t.id)),
            links: s.links.map((l) => (l.topicId && doomed.has(l.topicId) ? { ...l, topicId: null } : l)),
          };
        }),

      createLink: (input) => {
        const id = newId("link");
        const link: Link = {
          id,
          url: input.url,
          title: input.title,
          domain: input.domain,
          imageUrl: input.imageUrl === undefined ? `https://picsum.photos/seed/${id}/400/260` : input.imageUrl,
          note: input.note ?? "",
          topicId: input.topicId ?? null,
          keywords: input.keywords ?? [],
          createdAt: Date.now(),
        };
        set((s) => ({ links: [link, ...s.links] }));
        return link;
      },

      updateLink: (id, patch) =>
        set((s) => ({ links: s.links.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),

      deleteLink: (id) => {
        const link = get().links.find((l) => l.id === id) ?? null;
        if (link) set((s) => ({ links: s.links.filter((l) => l.id !== id) }));
        return link;
      },

      restoreLink: (link) =>
        set((s) => {
          if (s.links.some((l) => l.id === link.id)) return s;
          const links = [...s.links, link].sort((a, b) => b.createdAt - a.createdAt);
          return { links };
        }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => safeStorage),
    },
  ),
);
