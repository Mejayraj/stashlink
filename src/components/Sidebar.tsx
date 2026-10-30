import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronRight,
  Inbox,
  LayoutGrid,
  MoreHorizontal,
  Plus,
} from "lucide-react";

import { APP_NAME } from "@/lib/constants";
import { useAuthStore } from "@/lib/auth-store";
import { repo } from "@/lib/repo";
import { useDataStore } from "@/lib/store";
import type { Topic, ViewSelection } from "@/lib/types";
import { useUIStore } from "@/lib/ui-store";
import { cn } from "@/lib/utils";

import { ThemeToggle } from "./ThemeToggle";

interface SidebarContentProps {
  onNavigate?: () => void;
}

export function SidebarContent({ onNavigate }: SidebarContentProps) {
  const topics = useDataStore((s) => s.topics);
  const links = useDataStore((s) => s.links);
  const email = useAuthStore((s) => s.email);
  const view = useUIStore((s) => s.view);
  const setView = useUIStore((s) => s.setView);

  const [topicsOpen, setTopicsOpen] = useState(true);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [addingFor, setAddingFor] = useState<string | "root" | null>(null);

  const topLevel = topics.filter((t) => !t.parentId);
  const childrenOf = (id: string) => topics.filter((t) => t.parentId === id);
  const countFor = (id: string) => links.reduce((n, l) => (l.topicId === id ? n + 1 : n), 0);
  const unsortedCount = links.reduce((n, l) => (l.topicId ? n : n + 1), 0);

  const select = (next: ViewSelection) => {
    setView(next);
    onNavigate?.();
  };

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const commitRename = (topic: Topic, name: string) => {
    const trimmed = name.trim();
    if (trimmed) void repo.renameTopic(topic.id, trimmed);
    setRenamingId(null);
  };

  const commitSubtopic = (parentId: string, name: string) => {
    const trimmed = name.trim();
    setAddingFor(null);
    if (!trimmed) return;
    void repo.createTopic(trimmed, parentId);
    setExpanded((prev) => new Set(prev).add(parentId));
  };

  const deleteTopic = (topic: Topic) => {
    const doomed = new Set([topic.id, ...childrenOf(topic.id).map((t) => t.id)]);
    void repo.deleteTopic(topic.id);
    setMenuId(null);
    if (view.kind === "topic" && doomed.has(view.topicId)) setView({ kind: "everything" });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-2 pt-5">
        <span className="text-lg font-bold tracking-tight text-ink">{APP_NAME}</span>
      </div>

      <nav aria-label="Library" className="flex-1 overflow-y-auto px-2 pb-4">
        <NavRow
          selected={view.kind === "everything"}
          onClick={() => select({ kind: "everything" })}
          icon={<LayoutGrid aria-hidden className="size-4 text-mute" />}
          label="Everything"
          count={links.length}
        />
        <NavRow
          selected={view.kind === "unsorted"}
          onClick={() => select({ kind: "unsorted" })}
          icon={<Inbox aria-hidden className="size-4 text-mute" />}
          label="Unsorted"
          count={unsortedCount}
        />

        <div className="mt-4">
          <button
            type="button"
            onClick={() => setTopicsOpen((o) => !o)}
            aria-expanded={topicsOpen}
            className="flex h-8 w-full items-center gap-1 rounded-2xl px-2 text-xs font-semibold text-mute hover:text-ink"
          >
            <ChevronDown aria-hidden className={cn("size-3.5 transition-transform", !topicsOpen && "-rotate-90")} />
            Topics
          </button>

          {topicsOpen && (
            <div className="mt-0.5">
              {topLevel.map((topic) => (
                <TopicRow
                  key={topic.id}
                  topic={topic}
                  subtopics={childrenOf(topic.id)}
                  count={countFor(topic.id)}
                  selected={view.kind === "topic" && view.topicId === topic.id}
                  expanded={expanded.has(topic.id)}
                  renaming={renamingId === topic.id}
                  menuOpen={menuId === topic.id}
                  addingSubtopic={addingFor === topic.id}
                  onSelect={() => select({ kind: "topic", topicId: topic.id })}
                  onToggleExpanded={() => toggleExpanded(topic.id)}
                  onStartRename={() => setRenamingId(topic.id)}
                  onCommitRename={(name) => commitRename(topic, name)}
                  onCancelRename={() => setRenamingId(null)}
                  onOpenMenu={() => setMenuId(topic.id)}
                  onCloseMenu={() => setMenuId(null)}
                  onDelete={() => deleteTopic(topic)}
                  onStartAddSubtopic={() => setAddingFor(topic.id)}
                  onCommitSubtopic={(name) => commitSubtopic(topic.id, name)}
                  onCancelAddSubtopic={() => setAddingFor(null)}
                  renderSubtopic={(sub) => (
                    <TopicRow
                      key={sub.id}
                      topic={sub}
                      subtopics={[]}
                      count={countFor(sub.id)}
                      selected={view.kind === "topic" && view.topicId === sub.id}
                      expanded={false}
                      renaming={renamingId === sub.id}
                      menuOpen={menuId === sub.id}
                      addingSubtopic={false}
                      onSelect={() => select({ kind: "topic", topicId: sub.id })}
                      onToggleExpanded={() => {}}
                      onStartRename={() => setRenamingId(sub.id)}
                      onCommitRename={(name) => commitRename(sub, name)}
                      onCancelRename={() => setRenamingId(null)}
                      onOpenMenu={() => setMenuId(sub.id)}
                      onCloseMenu={() => setMenuId(null)}
                      onDelete={() => deleteTopic(sub)}
                      onStartAddSubtopic={() => {}}
                      onCommitSubtopic={() => {}}
                      onCancelAddSubtopic={() => {}}
                      renderSubtopic={() => null}
                    />
                  )}
                />
              ))}
              {topLevel.length === 0 && <p className="px-3 py-2 text-xs text-ash">No topics yet</p>}
            </div>
          )}
        </div>
      </nav>

      <div className="border-t border-hairline p-2">
        {addingFor === "root" ? (
          <InlineInput
            defaultValue=""
            placeholder="New topic name"
            ariaLabel="New topic name"
            onCommit={(name) => {
              setAddingFor(null);
              if (name.trim()) void repo.createTopic(name.trim(), null);
            }}
            onCancel={() => setAddingFor(null)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAddingFor("root")}
            className="flex h-10 w-full items-center gap-2 rounded-2xl px-3 text-sm font-semibold text-mute hover:bg-surface-card hover:text-ink"
          >
            <Plus aria-hidden className="size-4" />
            New topic
          </button>
        )}

        <div className="mt-1 flex items-center gap-1 rounded-2xl p-1 hover:bg-surface-card/70">
          <Link
            to="/account"
            aria-label="Account settings"
            className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl p-1"
            onClick={onNavigate}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-card text-sm font-semibold text-body">
              {(email?.charAt(0) ?? "?").toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate text-xs text-mute">{email ?? ""}</span>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

interface TopicRowProps {
  topic: Topic;
  subtopics: Topic[];
  count: number;
  selected: boolean;
  expanded: boolean;
  renaming: boolean;
  menuOpen: boolean;
  addingSubtopic: boolean;
  onSelect: () => void;
  onToggleExpanded: () => void;
  onStartRename: () => void;
  onCommitRename: (name: string) => void;
  onCancelRename: () => void;
  onOpenMenu: () => void;
  onCloseMenu: () => void;
  onDelete: () => void;
  onStartAddSubtopic: () => void;
  onCommitSubtopic: (name: string) => void;
  onCancelAddSubtopic: () => void;
  renderSubtopic: (sub: Topic) => ReactNode;
}

function TopicRow(props: TopicRowProps) {
  const { topic, subtopics, count, selected, expanded, renaming, menuOpen, addingSubtopic } = props;
  const hasChildren = subtopics.length > 0;

  return (
    <div>
      <div className="relative">
        {renaming ? (
          <InlineInput
            defaultValue={topic.name}
            placeholder="Topic name"
            ariaLabel="Rename topic"
            onCommit={props.onCommitRename}
            onCancel={props.onCancelRename}
          />
        ) : (
          <div
            className={cn(
              "group/row relative flex h-9 items-center rounded-2xl pl-1.5 pr-2",
              selected ? "bg-surface-card" : "hover:bg-surface-card/70",
            )}
          >
            {selected && (
              <span aria-hidden className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent" />
            )}
            {hasChildren ? (
              <button
                type="button"
                onClick={props.onToggleExpanded}
                aria-expanded={expanded}
                aria-label={expanded ? `Collapse ${topic.name}` : `Expand ${topic.name}`}
                className="flex size-5 shrink-0 items-center justify-center rounded-full text-ash hover:text-ink"
              >
                <ChevronRight aria-hidden className={cn("size-3.5 transition-transform", expanded && "rotate-90")} />
              </button>
            ) : (
              <span aria-hidden className="size-5 shrink-0" />
            )}
            <button
              type="button"
              onClick={props.onSelect}
              onDoubleClick={props.onStartRename}
              title={topic.name}
              className="min-w-0 flex-1 truncate px-1 text-left text-sm text-body"
            >
              {topic.name}
            </button>
            <span className="text-xs tabular-nums text-ash group-hover/row:opacity-0">{count}</span>
            <span className="absolute right-2 flex items-center gap-0.5 opacity-0 group-focus-within:opacity-100 group-hover/row:opacity-100">
              {!topic.parentId && (
                <button
                  type="button"
                  onClick={props.onStartAddSubtopic}
                  aria-label={`Add subtopic to ${topic.name}`}
                  className="flex size-6 items-center justify-center rounded-full bg-sidebar text-ash hover:text-ink"
                >
                  <Plus aria-hidden className="size-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={props.onOpenMenu}
                aria-label={`Options for ${topic.name}`}
                className="flex size-6 items-center justify-center rounded-full bg-sidebar text-ash hover:text-ink"
              >
                <MoreHorizontal aria-hidden className="size-3.5" />
              </button>
            </span>
          </div>
        )}
        {menuOpen && !renaming && <TopicMenu onDelete={props.onDelete} onClose={props.onCloseMenu} />}
      </div>

      {expanded && <div className="ml-5">{subtopics.map((sub) => props.renderSubtopic(sub))}</div>}
      {addingSubtopic && (
        <div className="ml-5">
          <InlineInput
            defaultValue=""
            placeholder="Subtopic name"
            ariaLabel="Subtopic name"
            onCommit={props.onCommitSubtopic}
            onCancel={props.onCancelAddSubtopic}
          />
        </div>
      )}
    </div>
  );
}

interface NavRowProps {
  selected: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  count: number;
}

function NavRow({ selected, onClick, icon, label, count }: NavRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={selected ? "page" : undefined}
      className={cn(
        "relative flex h-9 w-full items-center gap-2 rounded-2xl px-3 text-sm",
        selected ? "bg-surface-card font-semibold text-ink" : "text-body hover:bg-surface-card/70",
      )}
    >
      {selected && (
        <span aria-hidden className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent" />
      )}
      {icon}
      <span className="flex-1 truncate text-left">{label}</span>
      <span className="text-xs tabular-nums text-ash">{count}</span>
    </button>
  );
}

function TopicMenu({ onDelete, onClose }: { onDelete: () => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Topic options"
      className="absolute right-1 top-10 z-30 w-44 rounded-[32px] border border-hairline bg-canvas p-1.5"
    >
      <button
        type="button"
        role="menuitem"
        onClick={onDelete}
        className="flex h-9 w-full items-center rounded-2xl px-3 text-sm font-medium text-ink hover:bg-surface-card"
      >
        Delete topic
      </button>
      <p className="px-3 pb-1 pt-1 text-xs text-ash">Links move to Unsorted</p>
    </div>
  );
}

interface InlineInputProps {
  defaultValue: string;
  placeholder: string;
  ariaLabel: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}

function InlineInput({ defaultValue, placeholder, ariaLabel, onCommit, onCancel }: InlineInputProps) {
  const [value, setValue] = useState(defaultValue);
  const done = useRef(false);

  const commit = () => {
    if (done.current) return;
    done.current = true;
    onCommit(value);
  };
  const cancel = () => {
    if (done.current) return;
    done.current = true;
    onCancel();
  };

  return (
    <div className="field flex h-9 items-center px-3">
      <input
        autoFocus
        value={value}
        maxLength={40}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="field-input h-full w-full text-sm font-medium text-ink placeholder:text-ash"
      />
    </div>
  );
}
