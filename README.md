# Stashlink

Build "Stackfiy", a minimal, private link-saving web app. Its only job is to save links fast and keep them sorted into topic folders, each with an optional one-line reminder of why it was saved. This is Phase 1: frontend only, with mock data. No backend, no auth, no AI yet. Structure the code so a backend can be added later.

TECH
React + Vite + TypeScript, Tailwind, Zustand, Framer Motion (sparingly), lucide-react. Put the app name in a single constant (APP_NAME = "Stash").

DATA MODEL (src/lib/types.ts)
- Topic { id, name, parentId: string | null, createdAt }  // max 2 levels: topic > subtopic
- Link { id, url, title, domain, imageUrl: string | null, note: string, topicId: string | null, keywords: string[], createdAt }
  topicId null = "Unsorted".
Create a data layer (src/lib/repo.ts) with async functions: listTopics, createTopic, renameTopic, deleteTopic, listLinks, createLink, updateLink, deleteLink. Phase 1 implements them on Zustand with localStorage persistence. The UI must only call the repo, never touch storage directly, so Supabase can replace it later.

SEED DATA
3 topics (Design with subtopics Inspiration and Tools, Running, Study abroad) plus ~10 links spread across them and Unsorted. Use https://picsum.photos/seed/{id}/400/{height} for imageUrl, with varied heights. About half the links have a one-line note. If an image fails or is null, show a soft tinted block with the domain's first letter.

LAYOUT
- Left sidebar (240px): app name; "Everything" and "Unsorted" rows; a "Topics" section with a collapsible two-level tree; a "New topic" row at the bottom. Each row shows a link count, right-aligned, using tabular-nums. On hover a top-level topic shows a small "+" to add a subtopic. Subtopics cannot have children. Rename inline on double-click. Delete from a small menu; deleting a topic moves its links to Unsorted. On mobile the sidebar becomes a slide-in drawer.
- Top of main area: a pill search bar, centered, max 480px. Typing filters live across title, domain, note, keywords and topic name. "/" or Cmd/Ctrl+K focuses it.
- Below it: the ADD BAR, the hero of the app. One wide input with placeholder "Paste a link". On Enter or paste of a valid URL it saves instantly, with no modal and no extra steps. A second optional line under it appears after saving or on focus: "Why are you saving this? (optional)". Pressing Enter in the note field attaches the note to the link just saved.
- Main content: a masonry card grid using CSS columns with 8px gutters. Columns: 1 below 480px, 2 below 768px, 3 below 1024px, 4 above.

SAVE + AUTO-FILE BEHAVIOR (mock for now)
- On save, derive the title from the URL (domain plus readable path words) and the domain from the hostname. Use a placeholder image. Put the link at the top of the grid.
- Mock auto-file: put the link in the topic whose name or keywords best match the URL's domain or words. A simple keyword map in src/lib/autofile.ts is fine. If nothing matches, it goes to Unsorted. Isolate this in one function, autoFile(link, topics) => topicId | null, because it will be replaced by real AI in Phase 3.
- If the user is inside a topic when pasting, the link goes into that topic and skips auto-file.
- After auto-filing, show a small toast: "Filed in Design / Tools" with an Undo action (sends it to Unsorted) and a "Move" action. Auto-dismiss after 5 seconds.

LINK CARD
- Outer card: surface-card background, 16px radius, 8px padding. The image inside has an 8px radius (nested radius = outer minus padding) and a 1px inset outline of rgba(0,0,0,0.08) so it sits cleanly on the cream surface.
- Under the image: the one-line note is the primary text (14px, weight 600) if it exists; otherwise the title takes that role. Title (13px, mute color, one line truncated) and a row with a 14px favicon (use https://www.google.com/s2/favicons?domain={domain}&sz=32, 1px inset outline, 4px radius) plus the domain in 12px ash.
- Clicking the card opens the URL in a new tab.
- On hover, show small icon buttons at the image's top-right (circular, white, 32px): Edit note, Move to topic, Delete. Hover is instant: no entrance animation, no delay. The pressed state scales to 0.98.
- Edit note is inline on the card (single line, 120 character max, Enter saves, Esc cancels). Move opens a compact popover listing the topic tree. Delete shows an Undo toast rather than a confirm dialog.

EMPTY STATES
- No links in a topic: heading "Nothing in {topic} yet", body "Paste a link above and it'll land here."
- No search results: "No matches", body "Try a word from the title or your note."
- Truly empty app: heading "Save your first link", body "Paste it above. Stash files it for you."

DESIGN SYSTEM (follow exactly; one coherent look, not a mashup)
- Font: Inter, weights 400/500/600/700. Add letter-spacing -1.2px to any text 28px or larger. Body 16px/1.4, small 14px, captions 12px.
- Colors: canvas #ffffff; surface-soft #fbfbf9; surface-card #f6f6f3; secondary #e5e5e0; hairline #dadad3; ink #000000; body #33332e; mute #62625b; ash #91918c. Single accent: deep green #1E6B4F (pressed #175640), used ONLY for the focus ring, the active topic indicator, and Undo/primary actions. Make it one CSS variable so it's easy to swap. No other colors, no gradients, no card shadows.
- Radius vocabulary is exactly three values: 16px (buttons, inputs, cards), 32px (modals and popovers), and fully round (search bar, chips, circular icon buttons). No other radii except the 8px nested image radius.
- Page background #fbfbf9, sidebar white with a 1px hairline right border.
- Buttons: 40px height, 14px/700 label. Primary uses the accent, secondary uses #e5e5e0.
- Focus ring: 2px ink inner + 3px accent outer on all interactive elements.
- Selected sidebar row: surface-card background plus a 2px accent bar on the left.
- All counts and any numbers use font-variant-numeric: tabular-nums.
- Motion: 120ms ease-out for popovers and toasts only. Honor prefers-reduced-motion.
- Copy: sentence case everywhere, contractions, verb-first buttons, no exclamation marks, no "please", no "successfully".

DO NOT BUILD
Auth, backend, AI calls, tags, sharing, folders deeper than 2 levels, dark mode, settings pages, onboarding, animations beyond what's listed, or any feature not described above.

QUALITY BAR
Responsive from 360px up. Keyboard accessible. No console errors. Every interactive element has a visible focus state and an aria-label if icon-only.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://stashlink.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/96966a65-9ef9-4c43-b540-ddd620f1153b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
