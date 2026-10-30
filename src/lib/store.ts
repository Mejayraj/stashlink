import { create } from "zustand";

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

// In-memory cache only. The source of truth is the database behind
// src/lib/repo.ts; this store holds optimistic state that repo rolls back on
// sync failures.
interface DataState {
  topics: Topic[];
  links: Link[];
  loaded: boolean;
  setAll: (topics: Topic[], links: Link[]) => void;
  addTopic: (topic: Topic) => void;
  patchTopic: (id: string, patch: Partial<Topic>) => void;
  addLink: (link: Link) => void;
  patchLink: (id: string, patch: Partial<Link>) => void;
  removeLink: (id: string) => void;
  reinsertLink: (link: Link) => void;
  removeTopicTree: (ids: ReadonlySet<string>) => void;
  clear: () => void;
}

export const useDataStore = create<DataState>((set) => ({
  topics: [],
  links: [],
  loaded: false,

  setAll: (topics, links) => set({ topics, links, loaded: true }),

  addTopic: (topic) => set((s) => ({ topics: [...s.topics, topic] })),

  patchTopic: (id, patch) =>
    set((s) => ({ topics: s.topics.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

  addLink: (link) => set((s) => ({ links: [link, ...s.links] })),

  patchLink: (id, patch) =>
    set((s) => ({ links: s.links.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),

  removeLink: (id) => set((s) => ({ links: s.links.filter((l) => l.id !== id) })),

  reinsertLink: (link) =>
    set((s) => {
      if (s.links.some((l) => l.id === link.id)) return s;
      const links = [...s.links, link].sort((a, b) => b.createdAt - a.createdAt);
      return { links };
    }),

  // Deleting a topic deletes its subtopics and unfiles their links.
  removeTopicTree: (ids) =>
    set((s) => ({
      topics: s.topics.filter((t) => !ids.has(t.id)),
      links: s.links.map((l) => (l.topicId && ids.has(l.topicId) ? { ...l, topicId: null } : l)),
    })),

  clear: () => set({ topics: [], links: [], loaded: false }),
}));
