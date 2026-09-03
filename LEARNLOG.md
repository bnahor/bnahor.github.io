# The Shelf and The Library

Two compiled surfaces, one pipeline:

- **The Shelf** (`#/shelf`) — notes I've written, anchored to the source.
- **The Library** (`#/library`) — the catalogue of what I hold locally, which
  is the queue the shelf draws from.

Notes live in the Obsidian vault; the files live in `~/Desktop/resources`.
Neither is in this repo. The site compiles metadata from both.

```
~/Documents/Obsidian Vault/Learning Log/*.md   ← author here
~/Desktop/resources/**                         ← the files (never copied)
        │  scripts/ingest-library.ts   (scan → catalogue)
        │  scripts/ingest-learnlog.ts  (compile → notes)
        ▼
public/learnlog/{index.json, library.json, <id>.json}   ← committed + deployed
        │  fetched lazily at runtime
        ▼
homepage "On the shelf" rail  +  #/shelf  +  #/library  (code-split chunks)
```

The library ingest runs first: notes that name a `library:` item inherit its
page count and publisher PDF from it.

## Copyright — read this before adding a "download" button

The library is ~2.5 GB, largely commercially published books, and this repo is
a **public** GitHub Pages site. Nothing in `resources/` is ever copied into
`public/`, committed, or deployed. `library.json` is metadata only — title,
subject, length, and a link to where the work is actually published. Paths in
it are relative to the library root, never absolute.

Each row links out according to what the link honestly is:

| Shown       | Meaning                                              |
| ----------- | ---------------------------------------------------- |
| `Read free` | the author or publisher publishes the full text there |
| `Publisher` | the book's own page — where you'd buy it              |
| `shelf only`| held locally, published nowhere linkable              |

A URL the file was *downloaded from* is not a publication. Only hosts in
`OFFICIAL_HOSTS` (arXiv, OpenReview, NeurIPS, PMLR, JMLR, ACM) are trusted to
mean "free"; a course server hosting a scanned textbook is a mirror and gets
no link. Curated entries in the `LINKS` table always win over an inventory URL.

## Local mode

`vite dev` serves `resources/` read-only at `/library/*` (see `libraryLocal()`
in `vite.config.ts`). On this machine a page marker opens the actual book at
the actual page, and every library row gains an **Open** link.

The flag is `__LEARNLOG_LOCAL__`, defined `command === 'serve'`, so a
production build folds it to `false` and dead-code-eliminates every branch
that would reference a local file — verified: `dist/` contains no absolute
paths and no local-mode UI. Deployed, page markers fall back to the
publisher's PDF, or to the plain source link when there isn't one.

The middleware resolves, then `realpath`s, then checks containment, so both
`..` traversal and symlinks pointing out of the library are refused. Range
requests are supported, which is what lets a PDF viewer page through a 900-page
book without downloading it.

## Workflow

**Fast path — publishing is saving the file:**

```sh
npm run new "Modern Robotics — Lecture 3" -- --type lecture --source https://…
npm run learn:live    # watch vault → ingest → commit public/learnlog → push
```

Leave `learn:live` running: every note you save ships ~4s later (main branch
only; on other branches it just ingests).

**Starting from something you own:** open `#/library`, find the row, hit
**Start notes**. It copies the exact `npm run new …` command, pre-filled with
`--library <id>`, so the note inherits the page count and PDF link and the
library row flips to **Noted**.

**Slow path:**

```sh
npm run dev               # ingests both, then serves (local mode on)
npm run learn:watch       # re-ingest on vault change, no git
npm run learn:publish     # ingest + commit + push, one shot
```

A pre-commit hook (`scripts/hooks/pre-commit`, registered via `core.hooksPath`)
re-ingests and stages `public/learnlog` on every commit, so the deployed data
can't drift from the vault. It never blocks the commit.

Ingestion is diff-based and idempotent: running it twice changes nothing on
disk. `generatedAt` is only bumped when the compiled content actually differs,
so a 100 KB catalogue doesn't churn a diff on every commit. If the vault or
library is absent (CI, another machine) the relevant ingester exits quietly and
the committed JSON ships as-is.

Override locations with `LEARNLOG_VAULT` and `LEARNLOG_LIBRARY`.

## Note format

Copy `_template.md` in the vault to start a note:

```markdown
---
title: "Modern Robotics — Lecture 3"
type: lecture        # lecture | book | paper | course | video | article
source: https://youtube.com/watch?v=…
sourcePdf:           # direct PDF URL, when `source` is a landing page
library:             # library item id — inherits pages + PDF link
status: active       # queued | active | done | shelved
duration: 1:23:45    # video length (h:m:s, m:s, or bare minutes)
pages: 714           # book length — inherited from `library:` if unset
progress:            # explicit % — overrides computed
started: 2026-08-01
finished:
tags: [robotics]
public: true         # false (or draft: true) → never published
---
```

In the body:

- `00:14:32 — point` (or `14:32 —`) creates a **timestamp anchor**, rendered as
  a link that seeks the source video (YouTube `?t=`, media fragment elsewhere).
- `p. 42 — point` creates a **page anchor**, resolved in this order: the local
  file (local mode) → `sourcePdf` → the plain source link. A landing page never
  gets a `#page=` fragment, because it wouldn't honour one.
- Lines directly under a marker attach to it; a blank line ends the block.
- Everything else is a plain note. `**bold**`, `*italic*`, `` `code` ``,
  `[links](url)` and bullets render. Obsidian wikilinks degrade to text.
- Progress is computed automatically: last timestamp ÷ duration, or last page
  ÷ pages — unless `progress:` is set. `status: done` → 100%.

## Privacy

**Everything ingested is public** once pushed. Set `public: false` (or
`draft: true`) to keep a note local; the ingester skips it entirely. The vault
never enters the repo, and neither do the library's files.

## Commands

| Command                 | Effect                                           |
| ----------------------- | ------------------------------------------------ |
| `npm run new "Title" …` | scaffold a dated note in the vault               |
| `npm run dev`           | ingest both, then vite dev server with local mode |
| `npm run build`         | ingest both, then production build               |
| `npm run learn:ingest`  | one-shot ingest (library, then shelf)            |
| `npm run learn:watch`   | re-ingest on vault changes                       |
| `npm run learn:publish` | ingest + commit + push (main only)               |
| `npm run learn:live`    | watch + auto-publish on every save               |

The ingest scripts run under bun when installed, else node ≥ 22.6 — see
`scripts/learnlog.mjs`.
