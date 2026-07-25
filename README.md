# Portfolio

Personal portfolio website built with React, Tailwind CSS, Framer Motion, and Vite.

## Stack Highlights

- Route-based app shell (`/`, `/blog`, `/blog/:slug`, `/case-studies/:slug`)
- Repo-managed MDX blog workflow (`content/blog/*.mdx`)
- Build-time generated blog index + RSS
- Build-time GitHub contributions data payload (`public/data/github-contributions.json`)
- GitHub Pages deployment via Bun workflow

## Prerequisites

- Bun `1.2.23`
- Node.js `20.19+` (for toolchain compatibility)

## Setup

```bash
bun install
```

## Development

```bash
bun run dev
```

## Content Workflow

Generate a new draft post:

```bash
bun run new:post -- --title "Your post title"
```

The content generator runs during `dev` and `build` and updates:

- `src/generated/blog-index.json`
- `public/rss.xml`

## Quality Checks

```bash
bun run lint
bun run typecheck
bun run build
```

## GitHub Contributions Data

Generate/update contributions payload manually:

```bash
bun run generate:github-data
```

Optional environment variables:

- `GITHUB_USERNAME` (defaults to `RB9823`)
- `GITHUB_TOKEN` (recommended for GraphQL API reliability)
