<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Project decisions

- Data layer rule: the UI never touches storage directly. All reads/writes go
  through `src/lib/repo.ts` (async API) and Zustand store hooks; Phase 1
  persists to localStorage, so a backend can replace repo internals without UI
  changes.
- `src/lib/autofile.ts` `autoFile(link, topics)` is the single auto-filing
  entry point (Phase 1 keyword mock); it will be replaced by AI in Phase 3 —
  keep the UI calling only this function.
- The app renders behind a `useHydrated()` gate in `src/routes/index.tsx`
  because state comes from localStorage; never move app state back to SSR.
- Design tokens (colors, accent, radii, focus ring) live only in
  `src/styles.css`; components must use semantic classes (`bg-surface-card`,
  `text-mute`, `text-accent`), never hardcoded colors.
