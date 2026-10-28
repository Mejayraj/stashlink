import { forwardRef } from "react";
import { Search, X } from "lucide-react";

import { useUIStore } from "@/lib/ui-store";

export const SearchBar = forwardRef<HTMLInputElement>(function SearchBar(_props, ref) {
  const query = useUIStore((s) => s.query);
  const setQuery = useUIStore((s) => s.setQuery);

  return (
    <div className="relative mx-auto w-full max-w-[480px]">
      <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ash" />
      <input
        ref={ref}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search links"
        aria-label="Search links"
        autoComplete="off"
        className="h-11 w-full rounded-full border border-hairline bg-canvas pl-10 pr-10 text-sm text-ink placeholder:text-ash"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-ash hover:text-ink"
        >
          <X aria-hidden className="size-4" />
        </button>
      )}
    </div>
  );
});
