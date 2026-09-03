# The Shelf — learning log

Notes live in the Obsidian vault; the site compiles and renders them. The
vault is the **only** place notes are written — plain markdown + frontmatter,
so any editor works (Obsidian today, VS Code whenever).

```
~/Documents/Obsidian Vault/Learning Log/*.md   ← author here
        │  scripts/ingest-learnlog.ts (diff-based compile)
        ▼
public/learnlog/{index.json, <id>.json}        ← committed + deployed
        │  fetched lazily at runtime
        ▼
homepage "On the shelf" rail  +  #/shelf route (code-split chunk)
```

## Workflow

**Fast path — publishing is saving the file:**

```sh
npm run new "Modern Robotics — Lecture 3" -- --type lecture --source https://…
#   (or: bun run new "…" --type lecture --source …)

npm run learn:live    # watch vault → ingest → commit public/learnlog → push
```

Leave `learn:live` running in a terminal: every note you save ships ~4s
later (main branch only; on other branches it just ingests).

**Slow path — manual, same result:**

```sh
npm run dev               # ingests on startup, then serves
npm run learn:watch       # re-ingest on vault change, no git
npm run learn:publish     # ingest + commit + push, one shot
```

A pre-commit hook (`scripts/hooks/pre-commit`, registered via
`core.hooksPath`) re-ingests and stages `public/learnlog` on every commit,
so even a normal `git commit -m …` can't ship a stale shelf. It never blocks
the commit.

Ingestion is diff-based: only entries whose compiled JSON changed are
rewritten, so git diffs stay small. Deleting/renaming a note removes its
emitted JSON. If the vault isn't present (CI, another machine) the ingester
exits quietly and the committed `public/learnlog/` ships as-is.

Override the vault location with `LEARNLOG_VAULT=/path/to/vault`.

## Note format

Copy `_template.md` in the vault to start a note:

```markdown
---
title: "Modern Robotics — Lecture 3"
type: lecture        # lecture | book | paper | course | video | article
source: https://youtube.com/watch?v=…
status: active       # queued | active | done | shelved
duration: 1:23:45    # video length (h:m:s, m:s, or bare minutes)
pages: 714           # book length
progress:            # explicit % — overrides computed
started: 2026-08-01
finished:
tags: [robotics]
public: true         # false (or draft: true) → never published
---
```

In the body:

- `00:14:32 — point` (or `14:32 —`) creates a **timestamp anchor**. On the
  site it renders as a link that seeks the source video (YouTube `?t=`, media
  fragment elsewhere).
- `p. 42 — point` creates a **page anchor** for books.
- Lines directly under a marker attach to it; a blank line ends the block.
- Everything else is a plain note. `**bold**`, `*italic*`, `` `code` ``,
  `[links](url)` and bullets render. Obsidian wikilinks degrade to text.
- Progress is computed automatically: last timestamp ÷ duration, or last page
  ÷ pages — unless `progress:` is set explicitly. `status: done` → 100%.

## Privacy

**Everything ingested is public** once pushed — the compiled JSON is served
from the site. Set `public: false` (or `draft: true`) to keep a note local;
the ingester skips it entirely. The vault itself never enters the repo.

## Commands

| Command                 | Effect                                        |
| ----------------------- | --------------------------------------------- |
| `npm run new "Title" …` | scaffold a dated note in the vault            |
| `npm run dev`           | ingest, then vite dev server                  |
| `npm run build`         | ingest, then production build                 |
| `npm run learn:ingest`  | one-shot ingest                               |
| `npm run learn:watch`   | re-ingest on vault changes                    |
| `npm run learn:publish` | ingest + commit + push (main only)            |
| `npm run learn:live`    | watch + auto-publish on every save            |

The ingest script runs under bun when installed, else node ≥ 22.6 — see
`scripts/learnlog.mjs`.
