import { useState } from "react";
import { FolderInput, Pencil, Trash2 } from "lucide-react";

import { MAX_NOTE_LENGTH } from "@/lib/constants";
import { repo } from "@/lib/repo";
import { toast } from "@/lib/toast";
import type { Link } from "@/lib/types";
import { useUIStore } from "@/lib/ui-store";

const hoverButtonClass =
  "flex size-8 items-center justify-center rounded-full border border-hairline bg-canvas text-mute transition-transform hover:text-ink active:scale-[0.98]";

export function LinkCard({ link }: { link: Link }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [favFailed, setFavFailed] = useState(false);

  const initial = (link.domain.replace(/^www\./, "").charAt(0) || "?").toUpperCase();
  const escapedDomain = link.domain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const displayTitle = link.title.replace(new RegExp(`^\\s*${escapedDomain}\\s+(?:—|-|\\|)\\s*`, "i"), "") || link.title;
  const imageUrl = link.imageUrl && !link.imageUrl.includes("picsum.photos") ? link.imageUrl : null;

  const startEdit = () => {
    setDraft(link.note);
    setEditing(true);
  };

  const commitEdit = () => {
    const next = draft.trim().slice(0, MAX_NOTE_LENGTH);
    if (next !== link.note) void repo.updateLink(link.id, { note: next });
    setEditing(false);
  };

  const remove = () => {
    void repo.deleteLink(link.id);
    toast("Link deleted", [
      {
        label: "Undo",
        run: () => {
          void repo.restoreLink(link);
        },
      },
    ]);
  };

  return (
    <article className="group relative mb-2 break-inside-avoid rounded-2xl bg-surface-card p-2">
      {!editing && (
        <a
          href={link.url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${link.title} in a new tab`}
          className="absolute inset-0 z-0 rounded-2xl"
        />
      )}

      {imageUrl && (
        <div className="pointer-events-none relative z-[1]">
          <div className="overflow-hidden rounded-lg [box-shadow:inset_0_0_0_1px_var(--image-outline)]">
            <img
              src={imageUrl}
              alt=""
              loading="lazy"
              className="block w-full bg-secondary"
            />
          </div>
        </div>
      )}

      <div className="pointer-events-none relative z-[1] px-2 pb-1 pt-2">
        {editing ? (
          <input
            autoFocus
            value={draft}
            maxLength={MAX_NOTE_LENGTH}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitEdit();
              } else if (e.key === "Escape") {
                e.preventDefault();
                setEditing(false);
              }
            }}
            aria-label="Edit note"
            placeholder="Add a note"
            className="pointer-events-auto relative z-20 w-full rounded-lg border border-hairline bg-canvas px-2 py-1.5 text-sm font-medium text-ink"
          />
        ) : (
          <>
            {link.note ? (
              <p className="break-words border-l-2 border-accent pl-2 text-sm font-medium text-ink">{link.note}</p>
            ) : (
              <p className="truncate text-sm font-medium text-ink">{displayTitle}</p>
            )}
            {link.note && <p className="mt-1 truncate text-[13px] text-body">{displayTitle}</p>}
          </>
        )}
        <div className="mt-1.5 flex items-center gap-1.5">
          {favFailed ? (
            <span
              aria-hidden
              className="flex size-3.5 items-center justify-center rounded-[4px] bg-secondary text-[9px] font-medium text-mute [box-shadow:inset_0_0_0_1px_var(--image-outline)]"
            >
              {initial}
            </span>
          ) : (
            <img
              src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(link.domain)}&sz=32`}
              alt=""
              loading="lazy"
              onError={() => setFavFailed(true)}
              onLoad={(event) => {
                if (event.currentTarget.naturalWidth === 0) setFavFailed(true);
              }}
              className="size-3.5 rounded-[4px] [box-shadow:inset_0_0_0_1px_var(--image-outline)]"
            />
          )}
          <span className="truncate font-mono text-xs tabular-nums text-mute">{link.domain}</span>
        </div>
      </div>

      <div className="absolute right-3 top-3 z-10 flex gap-1 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
        <button type="button" aria-label="Edit note" onClick={startEdit} className={hoverButtonClass}>
          <Pencil aria-hidden className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label="Move to topic"
          onClick={() => useUIStore.getState().setMoveTargetId(link.id)}
          className={hoverButtonClass}
        >
          <FolderInput aria-hidden className="size-3.5" />
        </button>
        <button type="button" aria-label="Delete link" onClick={remove} className={hoverButtonClass}>
          <Trash2 aria-hidden className="size-3.5" />
        </button>
      </div>
    </article>
  );
}
