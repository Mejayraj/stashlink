import { useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

import { autoFile } from "@/lib/autofile";
import { MAX_NOTE_LENGTH } from "@/lib/constants";
import { repo } from "@/lib/repo";
import { useDataStore } from "@/lib/store";
import { toast } from "@/lib/toast";
import type { Link } from "@/lib/types";
import { parsePastedLink } from "@/lib/url";
import { useUIStore } from "@/lib/ui-store";

export function AddBar() {
  const [value, setValue] = useState("");
  const [noteValue, setNoteValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const linkRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => parsePastedLink(value), [value]);
  const valid = parsed !== null;

  const save = async () => {
    if (!parsed || saving) return;
    setError(null);
    setSaving(true);
    const { view } = useUIStore.getState();
    const topics = useDataStore.getState().topics;
    const inTopic = view.kind === "topic" ? view.topicId : null;
    const link = await repo.createLink({
      url: parsed.url,
      title: parsed.title,
      domain: parsed.domain,
      note: noteValue.trim().slice(0, MAX_NOTE_LENGTH),
      keywords: parsed.keywords,
      topicId: inTopic,
    });
    setValue("");
    setNoteValue("");
    setSaving(false);
    linkRef.current?.focus();
    if (inTopic) return;

    const filedId = autoFile(link, topics);
    if (!filedId) return;
    await repo.updateLink(link.id, { topicId: filedId });
    const topic = topics.find((t) => t.id === filedId);
    if (!topic) return;
    const parent = topic.parentId ? topics.find((t) => t.id === topic.parentId) : null;
    const label = parent ? `${parent.name} / ${topic.name}` : topic.name;
    toast(`Filed in ${label}`, [
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
            type="submit"
            disabled={!valid || saving}
            className="h-10 shrink-0 rounded-2xl bg-accent px-4 text-sm font-bold text-on-accent hover:bg-accent-pressed disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save
          </button>
        </div>

        {valid && (
          <input
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            placeholder="Why are you saving this? (optional)"
            aria-label="Why are you saving this? (optional)"
            maxLength={MAX_NOTE_LENGTH}
            className="field-input mt-2 h-10 w-full text-sm text-ink placeholder:text-ash"
          />
        )}
      </div>

      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </form>
  );
}
