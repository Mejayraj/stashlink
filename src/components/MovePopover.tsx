import { Fragment, useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";

import { repo } from "@/lib/repo";
import { useDataStore } from "@/lib/store";
import { useUIStore } from "@/lib/ui-store";
import { cn } from "@/lib/utils";

export function MovePopoverHost() {
  const moveTargetId = useUIStore((s) => s.moveTargetId);
  const setMoveTargetId = useUIStore((s) => s.setMoveTargetId);
  const links = useDataStore((s) => s.links);
  const topics = useDataStore((s) => s.topics);
  const reduce = useReducedMotion();

  const link = moveTargetId ? (links.find((l) => l.id === moveTargetId) ?? null) : null;

  useEffect(() => {
    if (!link) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoveTargetId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [link, setMoveTargetId]);

  const close = () => setMoveTargetId(null);
  const move = (topicId: string | null) => {
    if (link) void repo.updateLink(link.id, { topicId });
    close();
  };

  const topLevel = topics.filter((t) => !t.parentId);
  const childrenOf = (id: string) => topics.filter((t) => t.parentId === id);

  return (
    <AnimatePresence>
      {link && (
        <motion.div
          key="move-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.12, ease: "easeOut" }}
          className="fixed inset-0 z-[70] flex items-start justify-center bg-ink/20 p-4 pt-24"
          onClick={close}
        >
          <motion.div
            role="dialog"
            aria-label="Move link to a topic"
            initial={{ opacity: 0, y: reduce ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : 8 }}
            transition={{ duration: reduce ? 0 : 0.12, ease: "easeOut" }}
            className="max-h-[70vh] w-full max-w-xs overflow-y-auto rounded-[32px] border border-hairline bg-canvas p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="px-3 pb-1 pt-2 text-xs font-semibold text-mute">Move to</p>
            <MoveRow label="Unsorted" selected={!link.topicId} indented={false} onClick={() => move(null)} />
            {topLevel.map((topic) => (
              <Fragment key={topic.id}>
                <MoveRow
                  label={topic.name}
                  selected={link.topicId === topic.id}
                  indented={false}
                  onClick={() => move(topic.id)}
                />
                {childrenOf(topic.id).map((sub) => (
                  <MoveRow
                    key={sub.id}
                    label={sub.name}
                    selected={link.topicId === sub.id}
                    indented
                    onClick={() => move(sub.id)}
                  />
                ))}
              </Fragment>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MoveRow({
  label,
  selected,
  indented,
  onClick,
}: {
  label: string;
  selected: boolean;
  indented: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-10 w-full items-center rounded-2xl px-3 text-left text-sm text-body hover:bg-surface-card",
        indented && "pl-8",
      )}
    >
      <span className={cn("flex-1 truncate", selected && "font-semibold text-ink")}>{label}</span>
      {selected && <Check aria-hidden className="size-4 text-accent" />}
    </button>
  );
}
