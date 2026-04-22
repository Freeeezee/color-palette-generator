# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test runner is configured.

## Stack

- **Next.js 16.2.4** with App Router — see AGENTS.md warning about breaking changes
- **React 19.2.4**
- **Tailwind CSS v4** — uses `@import "tailwindcss"` and `@theme inline {}` syntax, NOT the old `@tailwind base/components/utilities` directives
- **TypeScript 5**
- **ESLint 9** with flat config (`eslint.config.mjs`)

## Architecture

App Router layout under `app/`:
- `layout.tsx` — root layout; sets up Geist fonts via CSS variables (`--font-geist-sans`, `--font-geist-mono`), applies them via `@theme inline` in `globals.css`
- `page.tsx` — home page (currently the default scaffold)
- `globals.css` — imports Tailwind v4, defines `--background`/`--foreground` CSS vars, dark mode via `@media (prefers-color-scheme: dark)`

CSS custom properties (`--background`, `--foreground`) are bridged into Tailwind utility classes (`bg-background`, `text-foreground`) through the `@theme inline` block in `globals.css`.
