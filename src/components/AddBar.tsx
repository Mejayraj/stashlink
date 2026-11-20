import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

import { autoFile } from "@/lib/autofile";
import { MAX_NOTE_LENGTH } from "@/lib/constants";
import { repo } from "@/lib/repo";
import { useDataStore } from "@/lib/store";
import { toast } from "@/lib/toast";
import type { Link } from "@/lib/types";
import { parsePastedLink } from "@/lib/url";
import { resolveTopicChoice, type TopicChoice } from "@/lib/topic-choice";
import { useUIStore } from "@/lib/ui-store";

import { TopicPicker } from "./TopicPicker";

export function AddBar() {
  const topics = useDataStore((state) => state.topics);
  const view = useUIStore((state) => state.view);
  const [value, setValue] = useState("");
  const [noteValue, setNoteValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const linkRef = useRef<HTMLInputElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const [saveButtonWidth, setSaveButtonWidth] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<TopicChoice | null>(null);

  useEffect(() => {
    const width = saveButtonRef.current?.getBoundingClientRect().width;
    if (width !== undefined) setSaveButtonWidth(width);
  }, []);

  useEffect(() => {
    setSelectedChoice(null);
  }, [view]);

  const parsed = useMemo(() => parsePastedLink(value), [value]);
  const valid = parsed !== null;

  const save = async () => {
    if (!parsed || saving) return;
    setError(null);
    setSaving(true);
    const { view } = useUIStore.getState();
    const topics = useDataStore.getState().topics;
    const viewedTopicId = view.kind === "topic" ? view.topicId : null;
    const defaultChoice: TopicChoice = viewedTopicId ?? "auto";
    const choice = selectedChoice ?? defaultChoice;
    const resolvedChoice = resolveTopicChoice(choice, viewedTopicId);
    const link = await repo.createLink({
      url: parsed.url,
      title: parsed.title,
      domain: parsed.domain,
      note: noteValue.trim().slice(0, MAX_NOTE_LENGTH),
      keywords: parsed.keywords,
      topicId: resolvedChoice.topicId,
    });
    setValue("");
    setNoteValue("");
    setSelectedChoice(null);
    setSaving(false);
    linkRef.current?.focus();

    const filedId = resolvedChoice.shouldAutoFile ? autoFile(link, topics) : resolvedChoice.topicId;
    if (!filedId) return;
    if (resolvedChoice.shouldAutoFile) await repo.updateLink(link.id, { topicId: filedId });
    const topic = topics.find((t) => t.id === filedId);
    if (!topic) return;
    const parent = topic.parentId ? topics.find((t) => t.id === topic.parentId) : null;
    const label = parent ? `${parent.name} / ${topic.name}` : topic.name;
    toast(`${resolvedChoice.shouldAutoFile ? "Filed in" : "Saved to"} ${label}`, [
      {
        label: "Undo",
        run: () => {
          void repo.updateLink(link.id, { topicId: null });
        },
      },
      {
        label: "Move",
        run: () => useUIStore.getState().setMoveTargetId(link.id),
      },
    ]);
  };

  const trySave = () => {
    if (!parsePastedLink(value)) {
      setError("That doesn't look like a link.");
      return;
    }
    void save();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        trySave();
      }}
      className="mt-4"
    >
      <div className="field px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <input
              ref={linkRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                // Enter must show the hint even while Save is disabled.
                if (e.key === "Enter") {
                  e.preventDefault();
                  trySave();
                }
              }}
              placeholder="Paste a link"
              aria-label="Paste a link"
              autoComplete="off"
              spellCheck={false}
              className="field-input h-10 w-full pr-9 text-[15px] text-ink placeholder:text-ash"
            />
            {value && (
              <button
                type="button"
                onClick={() => {
                  setValue("");
                  setError(null);
                  linkRef.current?.focus();
                }}
                aria-label="Clear"
                className="absolute right-0 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-ash hover:text-ink"
              >
                <X aria-hidden className="size-4" />
              </button>
            )}
          </div>
          <button
            ref={saveButtonRef}
            type="submit"
            disabled={!valid || saving}
            className="btn-glass h-10 shrink-0 rounded-2xl px-4 text-sm font-medium text-ink disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>

        <div className="mt-2 flex items-center gap-2 max-md:flex-col max-md:items-stretch">
          {valid && (
            <input
              value={noteValue}
              onChange={(e) => setNoteValue(e.target.value)}
              placeholder="Why are you saving this? (optional)"
              aria-label="Why are you saving this? (optional)"
              maxLength={MAX_NOTE_LENGTH}
              className="field-input h-10 min-w-0 flex-1 text-sm text-ink placeholder:text-ash max-md:w-full"
            />
          )}
          <TopicPicker
            topics={topics}
            choice={selectedChoice ?? (view.kind === "topic" ? view.topicId : "auto")}
            saveWidth={saveButtonWidth}
            onChange={setSelectedChoice}
          />
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </form>
  );
}
