export interface Topic {
  id: string;
  name: string;
  parentId: string | null; // null = top-level topic; at most one level of subtopics
  createdAt: number;
}

export interface Link {
  id: string;
  url: string;
  title: string;
  domain: string;
  imageUrl: string | null;
  note: string; // one-line reminder of why it was saved
  topicId: string | null; // null = Unsorted
  keywords: string[];
  createdAt: number;
}

export type ViewSelection =
  | { kind: "everything" }
  | { kind: "unsorted" }
  | { kind: "topic"; topicId: string };
