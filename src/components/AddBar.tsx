import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

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
  const [lastSaved, setLastSaved] = useState<Link | null>(null);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reduce = useReducedMotion();

  const showNoteLine = focused || lastSaved !== null;

  const saveText = async (text: string) => {
    const parsed = parsePastedLink(text);
    if (!parsed) {
      setError("That doesn't look like a link. Try something like example.com/article.");
      return;
    }
    setError(null);
    const { view } = useUIStore.getState();
    const topics = useDataStore.getState().topics;
    const inTopic = view.kind === "topic" ? view.topicId : null;
    const link = await repo.createLink({
      url: parsed.url,
      title: parsed.title,
      domain: parsed.domain,
      note: "",
      keywords: parsed.keywords,
      topicId: inTopic,
    });
    setValue("");
    setNoteValue("");
    setLastSaved(link);
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

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void saveText(value);
      }}
      className="mt-4"
    >
      <input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (error) setError(null);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onPaste={(e) => {
          const text = e.clipboardData.getData("text");
          if (parsePastedLink(text)) {
            e.preventDefault();
            void saveText(text);
          }
        }}
        placeholder="Paste a link"
        aria-label="Paste a link"
        autoComplete="off"
        spellCheck={false}
        className="h-12 w-full rounded-2xl border border-hairline bg-canvas px-4 text-[15px] text-ink placeholder:text-ash"
      />

      <AnimatePresence initial={false}>
        {showNoteLine && (
          <motion.div
            key="note-line"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.12, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="pt-2">
              <input
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  const saved = lastSaved;
                  if (saved && noteValue.trim()) {
                    void repo.updateLink(saved.id, { note: noteValue.trim().slice(0, MAX_NOTE_LENGTH) });
                  }
                  setNoteValue("");
                  setLastSaved(null);
                }}
                placeholder="Why are you saving this? (optional)"
                aria-label="Why are you saving this? (optional)"
                maxLength={MAX_NOTE_LENGTH}
                className="h-11 w-full rounded-2xl border border-hairline bg-canvas px-4 text-sm text-ink placeholder:text-ash"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="mt-2 text-xs text-mute">{error}</p>}
    </form>
  );
}
