# Link grid visual refresh

Restyle only the saved-link grid as Pinterest-like pins, retaining existing add, search, sidebar, auth, theme, routes, and data flows. Add the requested asynchronous link-preview lookup and its existing-card refresh action.

## Work
- Replace the old card surface and hover actions with natural-ratio image tiles, neutral placeholders/fallbacks, compact captions, and an accessible overflow menu.
- Add authenticated, bounded metadata fetching; persist its checked state, refresh previews on save without delaying the visible save, and check up to 10 older eligible links sequentially after loading.
- Add the additive metadata-status field and focused tests for URL safety and metadata parsing.
- Verify the grid and save/refresh behavior, tests, and current preview build.

## Technical details
- Use an authenticated TanStack server function, not a Supabase Edge Function, to fit the app runtime; validate each requested/redirect URL, enforce a 5-second timeout and 1 MB response cap, and return safe null metadata on fetch failures.
- Keep database access in `src/lib/repo.ts`, preserve per-user RLS, and use the project migration tool for the additive `meta_checked` field.
