# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run dev       # Vite dev server (http://localhost:5173)
npm run build     # tsc -b && vite build -> dist/
npm run preview   # serve the built dist/ locally
npm run lint      # oxlint
```

There is no test suite. Verify changes by running `npm run build` (which type-checks via `tsc -b` first) and by exercising the feature in a real browser — see "Testing UI changes" below.

## Architecture

This is a fully static, serverless single-page app (React + TypeScript + Vite). There is no backend and no external database by design — all data lives in the browser's IndexedDB via [Dexie](https://dexie.org/) (`src/db/index.ts`). This constraint drives several decisions:

- Routing uses `HashRouter` (`src/main.tsx`), not `BrowserRouter`, so client-side routes work with no server-side rewrite rule on static hosting.
- `vite.config.ts` sets `base: './'` (relative asset paths) so the built app works when hosted under an arbitrary subpath (e.g. GitHub Pages project pages).
- Deployment (see README) is a GitHub Actions workflow (`.github/workflows/deploy-github-pages.yml`) that builds and publishes `dist/` directly to GitHub Pages on every push to `main`, since the app intentionally has no server component.
- The PWA plugin (`vite-plugin-pwa`) makes the app installable/offline-capable, reinforcing that everything must work without a network round-trip.

### Data model (`src/types/models.ts`)

`TourContainer` is **recursive**: it has both `contents` (leaf `TourContentEntry[]`, i.e. packed equipment) and `containers` (nested `TourContainer[]`), so containers can be packed inside other containers to arbitrary depth. `Tour.containers` is the list of top-level (root) containers.

Because `TourContainer` is self-referential, Dexie's `update()` method (which generates a deep dotted-keypath type for partial updates) fails to type-check with a "circularly references itself" error. All tour writes in this codebase use `db.tours.put(fullObject)` / `bulkPut` instead of `.update()` — keep doing this for `tours` table writes.

### Dexie schema versioning (`src/db/index.ts`)

The `containers` field on `TourContainer` was added after the schema already had users with data in the old shape. `db.version(2).upgrade(...)` normalizes existing records (recursively defaulting missing `contents`/`containers` to `[]`) on open. Any future breaking shape change to stored records needs the same treatment: bump the version and add an `.upgrade()` migration rather than assuming existing local data matches the current TypeScript types.

### Tour container tree operations (`src/features/tours/containerTree.ts`)

All reads/writes to the nested container tree go through this module's pure, immutable helpers rather than ad-hoc recursion in components:
- `findContainerNode`, `updateContainerNode`, `removeContainerNode`, `insertContainerNode(parentId | null, node)` — `parentId: null` means top-level (`Tour.containers`).
- `isSameOrDescendant(node, targetId)` — cycle guard used before moving a container into another (prevents dropping a container into itself or its own descendant).
- `usageCounts(containers)` / `remainingQuantity(equipmentItemId, itemsById, counts, excludeAmount)` — walks the whole tour tree to compute how many units of each `EquipmentItem` are already used (as a container instance or as packed quantity), so the UI can cap additions at the inventory's `quantity` and hide/disable items that are fully used elsewhere in the tour.

### Drag-and-drop (`src/features/tours/TourDetailPage.tsx`, `ContainerCard.tsx`, `PoolItem.tsx`)

Built on `@dnd-kit/core`. Draggable/droppable ids follow fixed prefixes parsed in `handleDragEnd`:
- Draggables: `pool-<equipmentItemId>` (data `{ kind: 'pool-item' | 'pool-container', equipmentItemId }`, kind derived from the item's `type`) and `node-<tourContainerId>` (data `{ kind: 'node', containerId }`, for moving/nesting an existing container).
- Droppables: `container-<tourContainerId>` and the single `root` dropzone (top-level).

Because containers can be nested, their droppable zones are visually and DOM-nested inside each other. A custom `collisionDetection` (in `TourDetailPage.tsx`) uses `pointerWithin` and picks the **smallest-area** matching rect so a drop targets the innermost container under the pointer instead of an ancestor. If you add new droppable regions inside `ContainerCard`, keep this in mind.

`ContainerCard` renders nested child containers *inside* the parent's own card element (via `.container-card__nested`), not as visually-indented siblings — this is intentional so packing reads as "boxes inside boxes."

### Equipment pool grouping (`TourDetailPage.tsx`)

The "Container" and "Ausrüstung" side boxes (`PoolBox`) group items by `category` (via `groupByCategory`, with `UNCATEGORIZED` as the fallback bucket) into independently collapsible `CategoryGroup`s, and filter out items whose `remainingQuantity` is 0 (fully used elsewhere in the tour) rather than graying them out.

### Backup / restore (`src/features/backup/BackupPage.tsx`)

Export serializes all `equipmentItems` + `tours` to a single JSON file, converting each `image` Blob to a data URL (`src/utils/blob.ts`) since Blobs aren't JSON-serializable. Import reverses this and writes via `bulkPut` (upsert by id — merges into existing data rather than replacing it).

### Icons (`src/components/icons.tsx`)

Hand-written inline SVG components (feather-icons-style paths), not an icon library dependency. Add new icons here following the same `{ size = 16 }` prop pattern rather than pulling in a new package.

## Testing UI changes

No automated browser tests exist. The established pattern in this repo for verifying UI/interaction changes (drag-and-drop, forms, filters) is a throwaway Playwright script: install with `npm install --no-save playwright` (and `npx playwright install chromium` once per environment), drive the already-running `npm run dev` server, then `npm uninstall playwright --no-save` and delete the script afterward — don't leave Playwright or scratch test files in the repo.
