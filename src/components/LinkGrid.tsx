import { LinkCard } from "./LinkCard";
import type { Link } from "@/lib/types";

interface LinkGridProps {
  links: Link[];
  empty: { heading: string; body: string };
}

export function LinkGrid({ links, empty }: LinkGridProps) {
  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center px-4 py-24 text-center">
        <h2 className="text-display text-[28px] font-bold leading-tight text-ink">{empty.heading}</h2>
        <p className="mt-2 max-w-sm text-sm text-mute">{empty.body}</p>
      </div>
    );
  }

  return (
    <div className="columns-1 gap-2 min-[480px]:columns-2 min-[768px]:columns-3 min-[1024px]:columns-4">
      {links.map((link) => (
        <LinkCard key={link.id} link={link} />
      ))}
    </div>
  );
}
