---
title: "Shipping Intern Projects Like Products"
date: "2026-02-12"
summary: "How I scope projects so they survive beyond demo day."
tags: ["Career", "Execution", "Engineering"]
draft: false
---

A useful internship project has three properties:

1. It solves a real internal pain.
2. It has an explicit owner after you leave.
3. It exposes measurable impact.

## My checklist

- Define the baseline metric first.
- Agree on the first release contract.
- Keep architecture boring unless novelty is required.

```bash
# Keep deploy steps explicit and repeatable
bun run lint
bun run typecheck
bun run build
```

A shipped solution beats a perfect prototype every time.
