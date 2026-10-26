// Data layer the UI talks to. Phase 1 backs these with a Zustand store
// persisted to localStorage; swapping the internals for a real backend
// (e.g. Supabase in Phase 2) requires no changes to UI code.
import { useDataStore, type NewLinkInput } from "./store";
import type { Link, Topic } from "./types";

export const repo = {
  async listTopics(): Promise<Topic[]> {
    return useDataStore.getState().topics;
  },

  async createTopic(name: string, parentId: string | null = null): Promise<Topic> {
    if (!name.trim()) throw new Error("Topic name is required");
    return useDataStore.getState().createTopic(name, parentId);
  },

  async renameTopic(id: string, name: string): Promise<void> {
    useDataStore.getState().renameTopic(id, name);
  },

  async deleteTopic(id: string): Promise<void> {
    useDataStore.getState().deleteTopic(id);
  },

  async listLinks(): Promise<Link[]> {
    return useDataStore.getState().links;
  },

  async createLink(input: NewLinkInput): Promise<Link> {
    return useDataStore.getState().createLink(input);
  },

  async updateLink(id: string, patch: Partial<Omit<Link, "id">>): Promise<void> {
    useDataStore.getState().updateLink(id, patch);
  },

  async deleteLink(id: string): Promise<Link | null> {
    return useDataStore.getState().deleteLink(id);
  },

  async restoreLink(link: Link): Promise<void> {
    useDataStore.getState().restoreLink(link);
  },
};
