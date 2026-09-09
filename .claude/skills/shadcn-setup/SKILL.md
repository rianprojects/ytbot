---
name: shadcn-setup
description: Use when the user asks to install/add shadcn/ui, add a shadcn component, or set up Tailwind in the client/ Vite+React project.
---

# shadcn/ui setup (this project's client/)

`client/` is Vite + React (JS, not TS), CSS-variable theme already defined in
`src/index.css` (`--text`, `--text-h`, `--bg`, `--border`, `--brand`, `--brand-bg`,
`--brand-border`, `--code-bg`, `--shadow`, light/dark via `prefers-color-scheme`).

## One-time init (already done — skip unless starting fresh)

1. `cd client && npm install tailwindcss @tailwindcss/vite`
2. `vite.config.js`: add `tailwindcss()` plugin + `@` alias to `./src`.
   Use `import.meta.dirname`, NOT `__dirname` (project is ESM, `__dirname` is undefined).
3. Add `jsconfig.json` with `paths: { "@/*": ["./src/*"] }` so the shadcn CLI
   detects the alias (no tsconfig since this is plain JS).
4. Add `@import "tailwindcss";` as the first line of `src/index.css`.
5. `npx shadcn@latest init -d`

## Known gotcha: token name collisions

shadcn's init injects its own `--border`, `--accent`, `--accent-foreground` etc.
into `:root`, silently overwriting this project's pre-existing `--border` and
`--accent` custom properties (used across `App.css` for the purple button/badge
theme). **This project's custom accent color lives under `--brand`, `--brand-bg`,
`--brand-border`** — renamed specifically to avoid this collision. If re-running
init or pulling in new shadcn tokens, check `src/index.css` (both the `:root`
block and the `@media (prefers-color-scheme: dark)` block) for reintroduced
`--accent*`/`--border` clashes before committing.

When renaming the project's custom accent/border to `--brand*`, only rename
the CUSTOM ones — do not delete shadcn's own `--accent`/`--border`/etc. from
`:root`. Those feed `@theme inline`'s `--color-accent`/`--color-border`
(used by Tailwind utilities like `border-border`), and deleting them leaves
those utilities undefined in light mode. Verify with `npm run build`.

## Adding a component

```
cd client && npx shadcn@latest add <component-name>
```

Creates `src/components/ui/<component-name>.jsx`. Import as
`import { X } from "@/components/ui/x"`.

## After any config change

Restart the Vite dev server (kill the process on :5173, `npm run dev` again) —
config changes aren't hot-reloaded.
