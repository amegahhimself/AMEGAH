# Amegah.com — Portfolio Website Design Spec

**Date:** 2026-09-01
**Source brief:** `docs/Amegah.Com Brief.pdf`
**Client:** Amegah — Director, Cinematographer & Photographer

---

## 1. Overview

A portfolio website presenting three distinct creative practices — Directing,
Cinematography, Photography — under one identity. The work is the interface:
photography and film dominate every screen, text is minimal and editorial.

Two constraints shape every decision:

1. **The client maintains it alone.** Adding a project, a client logo, a whole
   new portfolio section, or reordering featured work must never require a
   developer.
2. **It must stay fast while serving heavy media**, especially on mobile, where
   the brief expects most Instagram-referred traffic to land.

## 2. Success criteria (from brief §11)

| # | Criterion | How this design meets it |
|---|---|---|
| 1 | Work looks exceptional | Edge-to-edge media, no boxed cards, black ground, minimal chrome |
| 2 | Navigation effortless | Six top-level items; name + role visible in every hero variant |
| 3 | Three disciplines distinct yet unified | Shared design language, different grid *cadence* per practice |
| 4 | Easy to update | All content — including disciplines and categories — is CMS data |
| 5 | Fast | Static shell (PPR) + tag-based revalidation + Sanity/Mux CDNs |
| 6 | Beautiful on mobile | Art-directed crops, tap-to-play, distinct rhythm — not a squeeze |
| 7 | Premium, not generic | Per-practice cadence + archival index typography |
| 8 | Scalable | Disciplines/categories are data; routes are dynamic; no redesign to grow |

## 3. Content model (Sanity)

### 3.1 Correction to the current schema

The schema built on 2026-09-01 hardcodes `discipline` and `category` as string
enums inside `sanity/schemaTypes/project.ts`. This fails brief §2's final bullet
("Add new portfolio sections when necessary") and success criteria #4 and #8:
adding a discipline or category would require editing code.

**This spec replaces those enums with referenced documents.**

### 3.2 Document types

**`discipline`** — a portfolio section. Client-creatable.
- `title` (string, required) — e.g. "Cinematographer"
- `slug` (slug, required) — drives the route `/[discipline]`
- `description` (text) — one line shown under the page heading
- `coverImage` (image, hotspot) — used in the homepage triptych
- `cadence` (string, list: `cinematic` | `filmstrip` | `editorial`) — selects the
  grid rhythm (see §6.3). Defaults to `editorial`.
- `orderRank` — drag-to-reorder

**`category`** — a filter within a discipline. Supports nesting.
- `title` (string, required)
- `slug` (slug, required)
- `discipline` (reference → `discipline`, required)
- `parent` (reference → `category`, optional) — makes Events → Corporate /
  Traditional Wedding / White Wedding / Parties / Funerals ordinary nested data
  rather than a special case
- `orderRank`

**`project`** — the core content type.
- `title`, `slug` (required)
- `discipline` (reference → `discipline`, required)
- `category` (reference → `category`, required) — the reference `options.filter`
  restricts choices to categories belonging to the selected discipline, so the
  editor cannot pick an invalid pairing
- `client` (reference → `client`), `partners` (array of references → `partner`)
- `year` (number)
- `coverImage` (image, hotspot, required)
- `mobileCoverImage` (image, hotspot, optional) — art-directed mobile crop
- `muxVideo` (Mux video asset, optional) — full playback
- `previewLoop` (file, optional) — short muted loop for hover/hero use
- `gallery` (array of images with `alt` + `caption`)
- `description` (portable text)
- `featured` (boolean), `orderRank` (drag-to-reorder)
- `archived` (boolean) — hides from the site without deleting

**`client`** / **`partner`** — `name`, `logo`, `url`, `orderRank`.

**`siteSettings`** (singleton) — `name`, `role`, `headshot`, `bio` (portable
text), `phone`, `email`, `instagramUrl`, plus:
- `heroVariant` (string, list: `reel` | `still` | `type`) — lets the client
  switch the homepage hero between the three designs themselves
- `heroVideo` / `heroImages` — content for the first two variants
- `seo` — default title/description/OG image

### 3.3 Ordering

Every orderable type uses drag-and-drop ordering rather than a manual number
field, so "rearrange featured projects" (brief §2) is a drag, not arithmetic.
Intended package: `@sanity/orderable-document-list` — **confirm Sanity v5
compatibility at implementation time**; if incompatible, fall back to an
`order` number field surfaced in a custom list view.

### 3.4 Migration note

No production content exists yet (the dataset is empty), so the schema change is
a straight replacement — no data migration required. Disciplines and categories
from brief §3 will be seeded as documents via a script so the client starts with
Director / Cinematographer / Photographer and their categories already in place.

## 4. Information architecture

| Route | Page |
|---|---|
| `/` | Homepage |
| `/[discipline]` | Discipline page (e.g. `/cinematographer`), filter bar + grid |
| `/work/[slug]` | Project page |
| `/about` | Headshot + biography |
| `/clients` | Clients & Partners (two sections, one page) |
| `/contact` | Phone, email, Instagram |
| `/studio` | Sanity Studio (already built) |

Primary nav: the disciplines (from CMS, in `orderRank` order), then About,
Clients, Contact. Disciplines sit at top level — the brief §3 lists them as
major structural items, and it makes success criterion #3 legible immediately.

Clients and Partners share one page: identical UI pattern, and it keeps the nav
to six items. Both are still separately labelled sections, as the brief lists
them separately.

## 5. Design system

### 5.1 Colour (brief §7)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0A0A0A` | Page ground. Near-black rather than `#000` to avoid halation against white text on OLED, while reading as black. |
| `--text` | `#FFFFFF` | Headlines, primary text |
| `--subtext` | `#D8D8D3` | Off-white — body and secondary text |
| `--muted` | `#8A8A85` | Grey — metadata, labels, inactive filters, borders |
| `--line` | `rgba(255,255,255,0.12)` | Hairline rules |

No accent colour. The brief does not ask for one, and restraint serves
"premium, not generic" better than a signature hue.

### 5.2 Typography (brief §6 asks for 1–2 combinations)

**Pairing A — recommended.** **Fraunces** (display) + **Inter** (UI/text).
Fraunces is a variable serif with an optical-size axis, so it can be tuned to
stay sturdy on a black ground — unlike Didone-style serifs (Playfair, Bodoni),
whose hairlines optically thin out on dark backgrounds. Warm, editorial,
uncommon in portfolio work.

**Pairing B — alternative.** **Instrument Serif** (display only) + **Geist
Sans** (UI/text, already installed). Sharper and more film-title in character;
higher contrast, so display sizes only.

Both are SIL Open Font Licence — free, transferable, nothing to license or
renew, supporting brief §9 (client owns everything). Loaded via
`next/font/google` for self-hosting and zero layout shift.

Scale: fluid `clamp()` ramp. Display sizes are genuinely large (the work and the
name should feel confident); body text is capped at a ~65-character measure for
readability (brief §6).

**Archival index device:** project metadata is set as `01 — Music Video — 2025`
in small-caps grotesk with letter-spacing. Applied consistently across cards,
project pages, and filters, it gives the site the character of a curated index
rather than a gallery template — this is the primary answer to criterion #7.

### 5.3 Motion

IntersectionObserver-driven reveals (fade + 8px rise) on media entering the
viewport; cross-fade on project open; hairline underline transitions on nav.
All CSS-driven where possible. Everything respects `prefers-reduced-motion`.
No parallax, no scroll-jacking, no cursor effects — they read as dated and cost
mobile performance.

## 6. Page designs

### 6.1 Homepage

1. **Hero** — one of three variants, switched by `siteSettings.heroVariant`:
   - `reel` — full-bleed muted autoplaying loop with poster image
   - `still` — full-bleed still, or slow cross-fade across curated stills
   - `type` — minimal typographic: name at display scale, no imagery
   All three render name + role + scroll cue identically, so criterion #2 (a
   visitor immediately understands who this is) holds regardless of choice.
2. **Featured work** — projects where `featured` is true, in `orderRank` order.
   Deliberately asymmetric editorial layout: alternating full-bleed and
   half-width blocks at varied heights, rather than a uniform grid.
3. **The three practices** — a triptych from the `discipline` documents: cover
   image, name in display serif, category list in small-caps. The section that
   makes criterion #3 explicit.
4. **Clients & partners** — logo marks in grey, resolving to off-white on hover.
5. **Contact close** — email, phone, Instagram.

### 6.2 Discipline page — `/[discipline]`

- Heading: discipline name (display serif), CMS description, project count.
- **Filter bar**: category pills built from `category` documents for this
  discipline. Selecting a parent category with children (e.g. Events) reveals a
  second row of sub-category pills.
- Filter state is client-side (instant, no reload) but **synced to the URL**
  (`?category=music-videos&type=white-wedding`) so filtered views are
  shareable — important given expected Instagram referral traffic.
- Grid renders in the discipline's `cadence` (§6.3).
- Pagination: "Load more" rather than infinite scroll — infinite scroll makes
  the footer (contact details) unreachable.

### 6.3 Grid cadence — the differentiator

All three disciplines share one visual language but differ in rhythm:

- `cinematic` (Director) — 16:9 dominant, fewer per row, largest scale
- `filmstrip` (Cinematographer) — denser, tighter gutters, horizontal emphasis
- `editorial` (Photography) — mixed portrait/landscape, varied heights

Same type, colour, and spacing tokens throughout, so the practices feel
distinct without fragmenting into three sub-brands (criterion #3). Because
`cadence` is a field on `discipline`, a newly added section picks one too.

### 6.4 Project page — `/work/[slug]`

- Full-bleed hero: Mux player when `muxVideo` is set, otherwise `coverImage`.
- Metadata block in the archival index style: title, discipline · category,
  year, client, partners.
- Description (portable text), then gallery — stills below the video for film
  work; stacked/varied for photography.
- Previous / next project navigation at the foot, scoped to the same discipline.

### 6.5 About, Clients, Contact

- **About** — large editorial headshot; bio in serif at a ~65ch measure.
- **Clients** — two labelled sections, logo grids, links out where a `url` exists.
- **Contact** — email as large clickable display type, phone, Instagram. No
  contact form: the brief asks only for contact information, and a form adds a
  backend, spam surface, and deliverability problems for no requested benefit.

## 7. Technical architecture

### 7.1 Data fetching and caching

Verified against `node_modules/next/dist/docs` (Next.js 16), which differs from
older Next.js conventions:

- `fetch` is **not** cached by default. Enable Cache Components
  (`cacheComponents: true` in `next.config.ts`), then wrap Sanity queries in
  `'use cache'` with `cacheTag(...)` and `cacheLife('max')`. This is the pattern
  the docs explicitly recommend for CMS content.
- A Sanity webhook hits a Route Handler at `/api/revalidate`, which calls
  `revalidateTag` for the affected content. Result: pages are served from a
  static shell (criterion #5), while the client's edits appear within seconds of
  publishing, with no redeploy (criterion #4). The webhook must verify Sanity's
  signature secret.
- `cacheComponents` also enables PPR by default and preserves component state
  across navigation via React `<Activity>` — so a visitor who filters, opens a
  project, and navigates back keeps their filter state.

All fetching happens in Server Components. Queries live in `sanity/lib/queries.ts`.

### 7.2 Images

- Sanity CDN transforms via `@sanity/image-url`, rendered through `next/image`
  for responsive `srcset` and lazy loading.
- LQIP blur placeholders from Sanity's asset metadata.
- Hotspot-aware crops, with `mobileCoverImage` overriding on small screens —
  this is brief §5's first bullet ("image cropping") treated as art direction
  rather than resizing.
- `next.config.ts` needs `images.remotePatterns` for `cdn.sanity.io` and
  `image.mux.com`.

### 7.3 Video (brief §4)

Mux, provisioned through the Vercel Marketplace as Sanity was. Free tier
(100k delivery minutes/month) comfortably covers a portfolio site.

| Brief requirement | Implementation |
|---|---|
| Autoplay where appropriate | Hero loop and hover previews only; `autoplay muted playsInline` |
| Muted background/showreel | Muted by default, unmute control on full playback |
| Poster/thumbnail images | Mux auto-generated posters, overridable with `coverImage` |
| Fullscreen playback | Native fullscreen via Mux Player |
| Mobile compatibility | `playsInline`; adaptive bitrate; tap-to-play, never autoplay full videos on mobile data |

### 7.4 Performance budget

- LCP < 2.5s on 4G mobile; CLS < 0.1.
- Hero media preloaded; everything below the fold lazy-loaded.
- Fonts self-hosted via `next/font` (no layout shift, no third-party request).
- No animation library unless a need survives review — CSS first.

## 8. Mobile (brief §5)

Not a compressed desktop. Specifically:

- **Cropping** — `mobileCoverImage` + hotspot, portrait-friendly ratios
- **Typography** — its own scale step, not a scaled-down desktop ramp
- **Video** — tap-to-play, never autoplay full videos on cellular
- **Navigation** — full-screen overlay menu, thumb-reachable
- **Touch** — hover previews replaced by tap; ≥44px targets
- **Gallery scrolling** — single column, generous rhythm
- **Loading speed** — smaller transforms, aggressive lazy-loading
- **Transitions** — same cross-fade language as desktop, shorter durations

## 9. Ownership and handover (brief §9)

- Code lives in the client's repository; no proprietary framework or lock-in.
- Fonts are SIL OFL — no licence to transfer, renew, or breach.
- Sanity project and Mux account ownership transferred to the client's own
  accounts at handover; both currently sit under the developer's Vercel team.
- Sanity content is exportable at any time (`sanity dataset export`).
- Handover includes a short written guide for routine content updates.

## 10. Out of scope

Contact form; blog/news; multi-language; e-commerce; client login/private
galleries; newsletter. None are in the brief. Each can be added later without
redesign — the architecture is additive.

## 11. Suggested implementation phases

The build is large enough to stage. Each phase leaves the site in a working,
reviewable state.

1. **Foundations** — schema correction (§3), seed disciplines/categories,
   Cache Components + revalidation webhook, design tokens, fonts, layout shell,
   navigation, footer.
2. **Work browsing** — discipline pages, filter bar with URL sync, grid cadences,
   project cards.
3. **Project pages** — Mux integration, hero, metadata, gallery, prev/next.
4. **Homepage** — three hero variants, featured layout, triptych, logo strip.
5. **Remaining pages** — About, Clients & Partners, Contact.
6. **Polish** — motion, mobile passes, metadata/OG images, performance budget
   verification, accessibility check.

## 12. Open items

1. **Typeface pairing** — client picks A or B (§5.2).
2. **Hero variant** — all three are built; client chooses in Studio.
3. **Real content** — copy, headshot, bio, logos, reel, and project media are
   client-supplied; the build proceeds against representative placeholders.
4. **Domain** — `amegah.com` to be registered/pointed at handover.
