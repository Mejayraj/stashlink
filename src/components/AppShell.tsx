import { useEffect, useMemo, useRef, useState, type FocusEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu } from "lucide-react";

import { APP_NAME } from "@/lib/constants";
import { useDataStore } from "@/lib/store";
import { useUIStore } from "@/lib/ui-store";

import { AddBar } from "./AddBar";
import { LinkGrid } from "./LinkGrid";
import { MovePopoverHost } from "./MovePopover";
import { SearchBar } from "./SearchBar";
import { SidebarContent } from "./Sidebar";
import { ToastHost } from "./ToastHost";

// Shared frame: sidebar, mobile drawer, toasts, and the move popover. The
// main area is a slot so home and account render inside the same shell.
export function AppFrame({ children }: { children: ReactNode }) {
  const drawerOpen = useUIStore((s) => s.drawerOpen);
  const setDrawerOpen = useUIStore((s) => s.setDrawerOpen);
  const reduce = useReducedMotion();
  const [desktopPinned, setDesktopPinned] = useState<boolean | null>(null);
  const [desktopPeek, setDesktopPeek] = useState(false);
  const desktopSidebarRef = useRef<HTMLElement>(null);
  const peekTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const syncSidebar = () => {
      let saved: string | null = null;
      try {
        saved = window.localStorage.getItem("stash-sidebar-pinned");
      } catch {
        // Use the responsive default when browser storage is unavailable.
      }
      setDesktopPinned(saved === null ? window.innerWidth >= 1024 : saved === "true");
      setDesktopPeek(false);
    };
    syncSidebar();
    window.addEventListener("resize", syncSidebar);
    return () => window.removeEventListener("resize", syncSidebar);
  }, []);

  const toggleDesktopSidebar = () => {
    const next = desktopPinned !== true;
    setDesktopPinned(next);
    setDesktopPeek(false);
    try {
      window.localStorage.setItem("stash-sidebar-pinned", String(next));
    } catch {
      // The choice lasts for this visit when browser storage is unavailable.
    }
  };

  const openPeek = () => {
    if (peekTimer.current) clearTimeout(peekTimer.current);
    setDesktopPeek(true);
  };

  const closePeek = () => {
    setDesktopPeek(false);
    if (peekTimer.current) clearTimeout(peekTimer.current);
  };

  const onDesktopPointerLeave = () => {
    if (desktopPinned) return;
    if (peekTimer.current) clearTimeout(peekTimer.current);
    peekTimer.current = setTimeout(() => {
      if (!desktopSidebarRef.current?.contains(document.activeElement)) setDesktopPeek(false);
    }, 150);
  };

  const onDesktopBlur = (event: FocusEvent<HTMLElement>) => {
    if (!desktopPinned && !event.currentTarget.contains(event.relatedTarget as Node | null)) closePeek();
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-surface-soft">
      <aside
        ref={desktopSidebarRef}
        onPointerEnter={openPeek}
        onPointerLeave={onDesktopPointerLeave}
        onFocusCapture={openPeek}
        onBlurCapture={onDesktopBlur}
        className={`hidden shrink-0 border-r border-hairline bg-sidebar transition-[width] duration-[160ms] ease-out motion-reduce:transition-none md:block ${
          desktopPinned === true ? "w-60" : desktopPinned === false ? "w-14" : "w-14 lg:w-60"
        } ${desktopPeek && !desktopPinned ? "z-50" : "relative"}`}
      >
        <div className={desktopPeek && !desktopPinned ? "sidebar-peek" : "h-full"}>
          <SidebarContent
            desktopMode={desktopPinned ? "pinned" : desktopPeek ? "peek" : "rail"}
            onDesktopToggle={toggleDesktopSidebar}
            onRequestPeek={openPeek}
            onNavigate={closePeek}
          />
        </div>
      </aside>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              key="drawer-overlay"
              className="fixed inset-0 z-40 bg-scrim md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.12, ease: "easeOut" }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              key="drawer"
              className="fixed inset-y-0 left-0 z-50 w-60 border-r border-hairline bg-sidebar md:hidden"
              initial={{ x: reduce ? 0 : -260 }}
              animate={{ x: 0 }}
              exit={{ x: reduce ? 0 : -260 }}
              transition={{ duration: reduce ? 0 : 0.12, ease: "easeOut" }}
            >
              <SidebarContent onNavigate={() => setDrawerOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto px-1 py-1">
        <div className="flex items-center gap-3 px-3 pt-3 md:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="flex size-10 items-center justify-center rounded-2xl border border-hairline bg-canvas text-body"
          >
            <Menu aria-hidden className="size-4" />
          </button>
          <span className="text-lg font-medium text-ink">{APP_NAME}</span>
        </div>
        {children}
      </main>

      <ToastHost />
      <MovePopoverHost />
    </div>
  );
}

export function HomeView() {
  const links = useDataStore((s) => s.links);
  const topics = useDataStore((s) => s.topics);
  const view = useUIStore((s) => s.view);
  const query = useUIStore((s) => s.query);
  const searchRef = useRef<HTMLInputElement>(null);

  // "/" or Cmd/Ctrl+K focuses search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
        return;
      }
      const target = e.target as HTMLElement | null;
      const typing =
        !!target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    let base = links;
    if (view.kind === "unsorted") base = base.filter((l) => !l.topicId);
    else if (view.kind === "topic") base = base.filter((l) => l.topicId === view.topicId);
    const q = query.trim().toLowerCase();
    if (!q) return base;
    const topicNames = new Map(topics.map((t) => [t.id, t.name.toLowerCase()]));
    const words = q.split(/\s+/);
    return base.filter((l) => {
      const topicName = l.topicId ? (topicNames.get(l.topicId) ?? "") : "";
      const hay = `${l.title} ${l.domain} ${l.note} ${l.keywords.join(" ")} ${topicName}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [links, topics, view, query]);

  const empty = useMemo<{ heading: string; body: string }>(() => {
    if (query.trim()) return { heading: "No matches", body: "Try a word from the title or your note." };
    if (view.kind === "topic") {
      const topic = topics.find((t) => t.id === view.topicId);
      return {
        heading: `Nothing in ${topic?.name ?? "this topic"} yet`,
        body: "Paste a link above and it'll land here.",
      };
    }
    if (view.kind === "unsorted") {
      return { heading: "Nothing in Unsorted yet", body: "Paste a link above and it'll land here." };
    }
    if (links.length === 0) {
      return { heading: "Save your first link", body: "Paste it above. Stash files it for you." };
    }
    return { heading: "No matches", body: "Try a word from the title or your note." };
  }, [query, view, topics, links]);

  return (
    <div className="mx-auto w-full max-w-[1080px] px-6 pb-16 pt-6 md:px-6 md:pt-10">
      <SearchBar ref={searchRef} />
      <AddBar />
      <div className="pt-6">
        <LinkGrid links={filtered} empty={empty} />
      </div>
    </div>
  );
}
