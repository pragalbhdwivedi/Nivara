# Nivara
A continent where seasons are not weather—they are politics.

## Lore / World Bible
- [Nivara World Bible Index](./docs/nivara/00_INDEX.md)

## Website
The Astro site lives in `/site` and deploys to GitHub Pages from this repository.

Local development:
```bash
cd site
npm install
npm run dev
```

For GitHub Pages builds, set `BASE_PATH` to the repository name (e.g., `/Nivara`).

## Content Sync (Canon Gate)
The website reads canon markdown from `docs/nivara` and only exposes pages linked in the indexes:
- `docs/nivara/00_INDEX.md` (world bible + sections)
- `docs/nivara/characters/00_CHARACTERS_INDEX.md` (characters)

### How to add a new canon page
1. Add a new Markdown file under `docs/nivara` (or `docs/nivara/characters/<NAME>/README.md` for characters).
2. Link that file from the appropriate index file above.
3. The site will generate routes and navigation only for the linked files.

### Route generation
- World bible sections map to the fixed routes (e.g., `/world`, `/power`, `/the-melt`, `/factions`, `/story-arcs`, `/symbols`, `/appendix`) based on the indexed filenames.
- Characters are listed from the characters index and map to `/characters/<slug>`.
- Any Markdown file not linked in the indexes is treated as non-existent.

### Quick test checklist
- Navigate to each main section (World, Power, The Melt, Factions, Story Arcs, Symbols, Appendix).
- Confirm the Characters listing is built from `00_CHARACTERS_INDEX.md`.
- Visit a non-indexed character slug and confirm it returns the in-world 404.
- Verify links between markdown documents resolve correctly in the site.
