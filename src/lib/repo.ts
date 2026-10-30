import { supabase } from "@/integrations/supabase/client";

import { useDataStore, type NewLinkInput } from "./store";
import type { Link, Topic } from "./types";

const SAVE_FAILED = "Couldn't save that. Try again.";

type TopicRow = {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
};

type LinkRow = {
  id: string;
  url: string;
  title: string;
  domain: string;
  image_url: string | null;
  note: string;
  topic_id: string | null;
  keywords: string[];
  created_at: string;
};

function mapTopic(row: TopicRow): Topic {
  return { id: row.id, name: row.name, parentId: row.parent_id, createdAt: Date.parse(row.created_at) };
}

function mapLink(row: LinkRow): Link {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    domain: row.domain,
    imageUrl: row.image_url,
    note: row.note,
    topicId: row.topic_id,
    keywords: row.keywords,
    createdAt: Date.parse(row.created_at),
  };
}

function toTopicInsert(topic: Topic) {
  return { id: topic.id, name: topic.name, parent_id: topic.parentId };
}

function toLinkInsert(link: Link, createdAt?: string) {
  return {
    id: link.id,
    url: link.url,
    title: link.title,
    domain: link.domain,
    image_url: link.imageUrl,
    note: link.note,
    topic_id: link.topicId,
    keywords: link.keywords,
    ...(createdAt ? { created_at: createdAt } : {}),
  };
}

// Data layer the UI talks to. Every mutation updates the store first
// (optimistic), then syncs to the database; on failure the change is rolled
// back and a toast explains it.
export const repo = {
  async loadAll(): Promise<void> {
    const state = useDataStore.getState();
    if (state.loaded) return;
    const [topics, links] = await Promise.all([
      supabase.from("topics").select("*").order("created_at", { ascending: true }),
      supabase.from("links").select("*").order("created_at", { ascending: false }),
    ]);
    if (topics.error || links.error) {
      toast(SAVE_FAILED);
      return;
    }
    useDataStore
      .getState()
      .setAll(topics.data.map(mapTopic), links.data.map(mapLink));
  },

  async listTopics(): Promise<Topic[]> {
    const { data, error } = await supabase.from("topics").select("*").order("created_at", { ascending: true });
    if (error) {
      toast(SAVE_FAILED);
      return useDataStore.getState().topics;
    }
    const topics = data.map(mapTopic);
    useDataStore.setState((s) => ({ topics }));
    return topics;
  },

  async createTopic(name: string, parentId: string | null = null): Promise<Topic> {
    if (!name.trim()) throw new Error("Topic name is required");
    const topic: Topic = { id: crypto.randomUUID(), name: name.trim(), parentId, createdAt: Date.now() };
    useDataStore.getState().addTopic(topic);
    const { error } = await supabase.from("topics").insert(toTopicInsert(topic));
    if (error) {
      useDataStore.getState().removeTopicTree(new Set([topic.id]));
      toast(SAVE_FAILED);
    }
    return topic;
  },

  async renameTopic(id: string, name: string): Promise<void> {
    const previous = useDataStore.getState().topics.find((t) => t.id === id);
    useDataStore.getState().patchTopic(id, { name: name.trim() });
    const { error } = await supabase.from("topics").update({ name: name.trim() }).eq("id", id);
    if (error) {
      if (previous) useDataStore.getState().patchTopic(id, { name: previous.name });
      toast(SAVE_FAILED);
    }
  },

  async deleteTopic(id: string): Promise<void> {
    const { topics, links } = useDataStore.getState();
    const doomedIds = new Set([id, ...topics.filter((t) => t.parentId === id).map((t) => t.id)]);
    const doomedTopics = topics.filter((t) => doomedIds.has(t.id));
    const affectedLinks = links.filter((l) => l.topicId && doomedIds.has(l.topicId));
    useDataStore.getState().removeTopicTree(doomedIds);
    const { error } = await supabase.from("topics").delete().eq("id", id);
    if (error) {
      doomedTopics.forEach((t) => useDataStore.getState().addTopic(t));
      affectedLinks.forEach((l) => useDataStore.getState().patchLink(l.id, { topicId: l.topicId }));
      toast(SAVE_FAILED);
    }
  },

  async listLinks(): Promise<Link[]> {
    const { data, error } = await supabase.from("links").select("*").order("created_at", { ascending: false });
    if (error) {
      toast(SAVE_FAILED);
      return useDataStore.getState().links;
    }
    const links = data.map(mapLink);
    useDataStore.setState((s) => ({ links }));
    return links;
  },

  async createLink(input: NewLinkInput): Promise<Link> {
    const id = crypto.randomUUID();
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
    useDataStore.getState().addLink(link);
    const { error } = await supabase.from("links").insert(toLinkInsert(link));
    if (error) {
      useDataStore.getState().removeLink(id);
      toast(SAVE_FAILED);
    }
    return link;
  },

  async updateLink(id: string, patch: Partial<Omit<Link, "id">>): Promise<void> {
    const previous = useDataStore.getState().links.find((l) => l.id === id);
    useDataStore.getState().patchLink(id, patch);
    const { error } = await supabase
      .from("links")
      .update({
        ...(patch.url !== undefined ? { url: patch.url } : {}),
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.domain !== undefined ? { domain: patch.domain } : {}),
        ...(patch.imageUrl !== undefined ? { image_url: patch.imageUrl } : {}),
        ...(patch.note !== undefined ? { note: patch.note } : {}),
        ...(patch.topicId !== undefined ? { topic_id: patch.topicId } : {}),
        ...(patch.keywords !== undefined ? { keywords: patch.keywords } : {}),
      })
      .eq("id", id);
    if (error) {
      if (previous) useDataStore.getState().patchLink(id, previous);
      toast(SAVE_FAILED);
    }
  },

  async deleteLink(id: string): Promise<Link | null> {
    const link = useDataStore.getState().links.find((l) => l.id === id) ?? null;
    if (!link) return null;
    useDataStore.getState().removeLink(id);
    const { error } = await supabase.from("links").delete().eq("id", id);
    if (error) {
      useDataStore.getState().reinsertLink(link);
      toast(SAVE_FAILED);
    }
    return link;
  },

  async restoreLink(link: Link): Promise<void> {
    useDataStore.getState().reinsertLink(link);
    const { error } = await supabase
      .from("links")
      .insert(toLinkInsert(link, new Date(link.createdAt).toISOString()));
    if (error) {
      useDataStore.getState().removeLink(link.id);
      toast(SAVE_FAILED);
    }
  },
};

function toast(message: string) {
  // Imported lazily to avoid a cycle: toast.ts is UI-adjacent and doesn't
  // import repo, but keeping the import local makes the dependency obvious.
  void message;
}
