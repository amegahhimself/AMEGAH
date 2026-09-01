# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project state

This is Amegah's portfolio website (director/cinematographer/photographer) — see `docs/Amegah.Com Brief.pdf` for the full client brief. Next.js App Router + shadcn/ui, with Sanity as the headless CMS so the client can manage projects/media without a developer. Most of the actual page UI is still unbuilt — `app/page.tsx` is still the default `create-next-app` starter page.

## Commands

- `npm run dev` — start the dev server (Turbopack-based; Next.js 16)
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint (flat config via `eslint.config.mjs`, extends `eslint-config-next`)

There is no test runner configured yet.

## Important: this is not the Next.js you know

Next.js 16 here has breaking changes vs. training data (APIs, conventions, file structure). Per `AGENTS.md`, read the relevant guide under `node_modules/next/dist/docs/` before writing routing, data-fetching, or config code, and heed deprecation notices. Notably, layout props are already typed via the generated `LayoutProps<"/">` helper (see `app/layout.tsx`) rather than a hand-written props interface.

## Architecture

- **`app/`** — App Router routes. `app/layout.tsx` is the root layout (Geist Sans/Mono fonts via `next/font/google`); `app/globals.css` holds Tailwind v4 + shadcn CSS variables/theme.
- **`components/ui/`** — shadcn/ui components (generated, not hand-authored — add more via the `shadcn` CLI rather than writing them from scratch).
- **`lib/utils.ts`** — shared helpers (currently the shadcn `cn()` class-merge utility).
- **`components.json`** — shadcn config: style `base-nova`, base color `neutral`, icon library `lucide`, no Tailwind prefix. Path aliases: `@/components`, `@/components/ui`, `@/lib`, `@/hooks`.
- **Styling** — Tailwind CSS v4 (`@tailwindcss/postcss`, no `tailwind.config.*` file — config lives in `app/globals.css`), `class-variance-authority` + `tailwind-merge` for variant/class composition, `tw-animate-css` for animation utilities.
- **Path alias** — `@/*` maps to the repo root (`tsconfig.json`).

## Adding shadcn components

Use the `shadcn` CLI (already a dependency) rather than hand-rolling components, so generated files match `components.json`'s configured style/aliases.

## Content (Sanity CMS)

Content is managed in Sanity, provisioned via the Vercel Sanity integration (project ID/dataset/tokens live in `.env.local`, pulled with `vercel env pull`). Studio is embedded at `/studio` (`app/studio/[[...tool]]/page.tsx`).

- **`sanity/schemaTypes/`** — document schemas: `project` (the core content type — has `discipline` [director/cinematographer/photographer] with a `category` field whose valid options depend on discipline per the brief, plus an `eventType` sub-field that only appears for Cinematographer → Events), `client`, `partner`, `siteSettings` (singleton: name, headshot, bio, phone, email, Instagram URL).
- **`sanity/structure.ts`** — pins Site Settings as a singleton at the top of the Studio's document list.
- **`sanity/lib/client.ts`** / **`sanity/lib/image.ts`** — fetch client and image URL builder for use in Next.js pages/components.
- Video: `project` currently has `coverVideo` (direct file upload) and `externalVideoUrl` (link to an external host) as a placeholder — no dedicated video-hosting provider (e.g. Mux) has been chosen yet; revisit before building out heavy video playback per the brief's performance requirements.
