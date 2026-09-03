# Phase 6 verification — performance and accessibility

Measured 2026-09-03, on branch `phase-6-polish`, against a **production build**
(`rm -rf .next && npm run build && npm run start`, port 3000) with the live
Sanity dataset's real curated content (Pexels photography, two Mux-hosted
videos — the homepage hero / "Northern Lights" starry-mountain clip, and
"Salt and Water"'s fisherman clip). `npm run dev` was never used for any
measurement here, per the known trap where Cache Components can serve
pre-seed content in dev.

Tooling: `npx lighthouse` v13.4.1, `--form-factor=mobile
--throttling-method=simulate` (mobile CPU/network simulation; there is no
`--preset=mobile` in this version, `--form-factor=mobile` is the mobile
profile). All Lighthouse runs are **local (loopback) measurements** — no
real network latency, no real mid-tier phone CPU. §7.4's LCP/CLS budget is a
4G-mobile budget; a local run flatters it. Numbers below are reported
verbatim from Lighthouse JSON output, not hand-adjusted.

## Performance (Lighthouse, mobile profile)

Lighthouse's simulated-throttling numbers vary run to run on a local
machine competing with everything else running on it. Where a metric moved
meaningfully across repeat runs, both the range and a representative run are
recorded rather than picking the best number.

| Page | Runs | Performance score | LCP | CLS | TBT |
|---|---|---|---|---|---|
| `/` | 3 runs | 73–77 | **5.7s – 8.4s** | 0 – 0.061 | 80–170ms |
| `/cinematographer` | 3 runs | 78–92 | 3.4s – 3.5s | 0 – 0.256 | 0ms |

**Spec §7.4 requires LCP < 2.5s and CLS < 0.1. Both pages fail the LCP
budget on every run, including the most favorable local run recorded.**
This is stated plainly as a finding, not smoothed over — a local run is
already the best case, so a real 4G client will be slower, not faster.

### Task 6 update — the two LCP root causes above were fixed in source; re-measured

Both fixes below were implemented exactly as scoped (see git history for
`components/home-hero.tsx`, `components/project-card.tsx`,
`components/work-browser.tsx`), verified against a **fresh production
build** (`rm -rf .next && npm run build && npm run start`), and confirmed by
hand in the server-rendered HTML (`curl`), not just by reading source:

- **`/` (homepage hero poster)**: `HomeHero` now renders a `priority`
  `next/image` poster (`posterUrl(still) ?? muxPoster`, where `muxPoster` is
  built from `https://image.mux.com/${playbackId}/thumbnail.jpg?...` when no
  Hero Still is configured) stacked behind `<HeroReel>`. Confirmed in the
  production server HTML: a real `<img>` for the poster is present
  before any JS runs, and Next emits a matching `<link rel="preload"
  as="image" ...>` in `<head>`. This is a genuine fix to the diagnosed
  bug (poster now discoverable in the initial HTML) — see "still fails,
  new root cause" below for why the Lighthouse *metric* didn't move.

- **`/cinematographer` (first card eager load)**: `priority` is now threaded
  `WorkBrowser` → `ProjectCard` → `CoverImage`, passed only as
  `priority={index === 0}` from `work-browser.tsx`. Confirmed in the
  production HTML: the first project card's `<img>` has `loading="eager"
  fetchpriority="high"`, every later card still has `loading="lazy"` (no
  `fetchpriority`). Lighthouse's own `lcp-discovery-insight` audit for this
  page went from failing (`eagerlyLoaded: false`, `priorityHinted: false`)
  to a clean pass — `priorityHinted: true`, `requestDiscoverable: true`,
  `eagerlyLoaded: true` — confirming the fix does exactly what it was meant
  to at the DOM/discoverability level. `project-card.test.tsx` now pins both
  directions (`priority` → `loading="eager"`/`fetchpriority="high"`, default
  → `loading="lazy"`/no `fetchpriority`).

**Re-run, same invocation as Task 5** (`npx lighthouse <url>
--form-factor=mobile --throttling-method=simulate`, production build, 2–3
runs per page):

| Page | Before (Task 5) | After (Task 6) | Budget met? |
|---|---|---|---|
| `/` | 5.7s – 8.4s | **8.0s – 8.5s** | No — still fails, see below |
| `/cinematographer` | 3.4s – 3.5s | **3.4s** (unchanged) | No — see below |

**These numbers are reported honestly: neither page's Lighthouse-measured
LCP moved into budget, despite both fixes being correctly implemented and
independently verified at the DOM level.** Two different explanations,
investigated separately:

**`/cinematographer` — the fix works; the `simulate` metric doesn't reflect
it.** The discoverability audit (`lcp-discovery-insight`) is now a clean
pass, and `lcp-breakdown-insight`'s own subparts for the LCP image sum to
~450ms (TTFB 2.6ms + resource load 431ms + render delay 21ms) — nowhere
near 3.4s, the same mismatch Task 5 already flagged as a `simulate`-mode
quirk (Lighthouse's `--throttling-method=simulate` estimates the LCP
*metric* from a modeled network-dependency graph of the whole page, not
purely the observed timing of the LCP resource, so a per-resource fix can
leave the reported metric unmoved). As a cross-check, the same page under
`--throttling-method=devtools` (a real trace, not a simulated model) reports
**LCP 2.2s — inside the 2.5s budget**, performance score 98. This is strong
evidence the fix is real; it's the `simulate` metric specifically that isn't
crediting it. Kept the `simulate` numbers as the primary, Task-5-comparable
record per instructions, but the `devtools` result is logged here since it
materially changes the honest picture of whether this fix "worked."

**`/` — a genuinely new, deeper root cause, found by inspecting the trace.**
`lcp-breakdown-insight` on every re-run (`simulate` and `devtools` alike)
names the LCP element as `slot > video` — the native `<video>` element
inside `<mux-player>`'s shadow DOM — not our new poster `<img>`. Inspecting
that node's HTML in the trace shows why: `<video crossorigin
playsinline muted loop preload="metadata" src="blob:...">` — **no `poster`
attribute**. `@mux/mux-player-react`'s `poster` prop does not forward to the
underlying native `<video>` element's `poster` attribute; it's applied at
the custom-element level for its own instant-paint UI, not exposed as a
browser-recognized LCP-eligible poster. Per the LCP spec, a `<video>`
element with no `poster` attribute becomes an LCP candidate once its own
first frame decodes and paints — which only happens after the ~1MB Mux
Player chunk loads, the manifest is fetched, and the first frame decodes,
i.e. exactly the slow path this task set out to avoid. Because that later
video paint is a *same-or-larger*-sized element than our `<img>`, Chrome's
LCP algorithm credits it as the new (later, worse) candidate, overriding
the fast poster paint entirely. **Our poster fix is real and independently
verified (present in server HTML, preloaded) — it is simply not what
Lighthouse ends up measuring, because a second, unrelated element (the bare
`<video>` tag) supersedes it as the LCP candidate once the player mounts.**
Fixing this fully would mean getting `@mux/mux-player-react` to set a real
`poster` attribute on its inner `<video>` element (a mux-player-specific
question, possibly a wrapper-level workaround or an upstream issue) — out of
scope for this task's two narrowly-defined fixes. **Logged as a new,
outstanding item**, not silently left in the old "no poster in HTML" framing
that Task 5 used, since that framing is now factually superseded.

### Why `/` misses LCP so badly (5.7s–8.4s vs. a 2.5s budget)

The LCP element on every home page run is the Mux player's poster `<img>`
inside `mux-player`'s shadow DOM
(`lcp-discovery-insight` reports `requestDiscoverable: false`,
`priorityHinted: false`). Root cause, confirmed by reading
`components/home-hero.tsx` / `components/hero-reel.tsx`:

```ts
// components/home-hero.tsx
const HeroReel = dynamic(() => import('./hero-reel').then((mod) => mod.HeroReel), {
  ssr: false,
  ...
})
```

`HeroReel` — and therefore the `<mux-player>` element and its poster image —
is loaded via `next/dynamic({ ssr: false })`, so **it is not in the
server-rendered HTML at all**. The browser's preload scanner cannot discover
the poster image until React hydrates and the ~1MB Mux Player chunk has
been fetched and executed client-side. That client round-trip is the
dominant cost, not image weight (`lcp-breakdown-insight`'s own subparts —
TTFB, resource load delay/duration, render delay — sum to under 700ms; the
remaining ~5-7.5s is the gap between navigation and the dynamic import
resolving).

This is **not** a small, contained fix. It's a deliberate architectural
tradeoff from earlier phases (avoid shipping the Mux Player chunk on every
page that doesn't need it) that trades homepage LCP for bundle size
elsewhere. Fixing it properly means something like eagerly rendering a real
`<img fetchpriority="high">` poster synchronously in the server HTML (so the
preload scanner finds it immediately) while still deferring the interactive
`<mux-player>` swap-in to the client — a real change to `HeroReel`'s
contract, not a CSS/class tweak. **Logged as outstanding**, not attempted
here.

### Why `/cinematographer` misses LCP (3.4s–3.5s vs. a 2.5s budget)

The LCP element is the first project card's cover image
(`components/project-card.tsx`'s `<picture><img class="cover-art"
loading="lazy" …>`, "Salt and Water"). It is `loading="lazy"` even though
it's the first, above-the-fold grid image on the page — `lcp-discovery-insight`
flags `eagerlyLoaded: false` and `priorityHinted: false`. This is a real,
identifiable bug (the first N visible cards in a grid should not
lazy-load), but fixing it correctly means plumbing an eager/priority flag
through `ProjectCard` for the first row across every place it's rendered
(`featured-work.tsx`, `work-browser.tsx`, both cadences), which is more than
a single small edit and risks the T2/T3 sizing work from earlier in this
phase. **Logged as outstanding**, not attempted here.

### CLS

`/` is comfortably inside budget (0–0.061) on every run. `/cinematographer`'s
CLS is noisy — 0 on two of four runs, 0.172 and 0.256 on the other two,
with the same build and same server. This looks like a race between the
image's LQIP blur swap and grid reflow that only sometimes lands inside one
Lighthouse trace's window, rather than a deterministic layout shift; it
could not be reliably reproduced or isolated in the time this task allows.
**Logged as outstanding** — worth a closer look (e.g., a WebPageTest
multi-run or Chrome's Performance panel with the CPU throttled) rather than
guessed at here.

## Accessibility (Lighthouse)

Run against `/`, `/cinematographer`, `/work/northern-lights`, `/about` (plus
`/contact` checked by hand below).

| Page | Accessibility score |
|---|---|
| `/` | 100 |
| `/cinematographer` | 100 (**98 before the heading-order fix below**) |
| `/work/northern-lights` | 100 |
| `/about` | 100 |

### Issue found and fixed: skipped heading level on discipline pages

Lighthouse's `heading-order` audit failed on `/cinematographer` (and by the
same code path, every `/[discipline]` page): the page's `<h1>` was followed
directly by `<h3>` project titles inside `WorkBrowser` → `ProjectCard`, with
no `<h2>` in between (unlike the homepage, where `featured-work.tsx`
supplies an `<h2>Selected work</h2>` before the same `ProjectCard`s, masking
the bug there).

**Fix**: `components/project-card.tsx` — changed the project title from
`<h3>` to `<h2>`. Verified the new hierarchy by hand on every page that
renders `ProjectCard` (`/`, `/cinematographer`, and the other discipline
pages by inspection of the shared component): homepage keeps `h1 > h2
("Selected work") > h2` (siblings, not a skip); discipline pages now read
`h1 > h2` directly (also not a skip). No test asserted the `h3` tag, so no
test needed updating; the full suite (239 tests) still passes.

### Manual checks (Lighthouse cannot verify these)

**Tab through the homepage and the mobile menu — does focus stay visible,
does the overlay menu trap focus?**

Checked with a headless Playwright script (`page.keyboard.press('Tab')`,
inspecting `document.activeElement`) at a 390×844 mobile viewport, since
this is exactly the case the brief calls out as needing a real browser check
rather than Lighthouse's device emulation.

- Focus visibility: the first Tab stop (`Amegah` logo link) reported
  `outline-style: auto` from the browser's native focus ring — visible,
  not suppressed.
- **Focus trap: found broken, then fixed.** Opening the mobile menu and
  tabbing 7 times moved focus through the 6 menu links and then *out* of
  the menu onto the (visually covered) homepage `<mux-player>` and project
  cards behind the opaque overlay — a real keyboard trap violation (WCAG
  2.4.3): a keyboard-only user tabbing forward lands on content that's
  present but hidden under the menu.

  **Fix**: `components/site-header.tsx` — added a `role="dialog"
  aria-modal="true"` to the mobile nav, a `Tab`/`Shift+Tab` handler that
  cycles focus between the menu button and its links (never escaping to the
  page underneath), `Escape` to close, and focus returns to the menu
  button on close (both via Escape and via link click, since navigating away
  makes this moot for the mouse case but matters for close-without-navigating).
  Re-verified after the fix: 12 forward Tabs cycle cleanly through
  `Contact → Close → Director → Contact → …` without escaping, and Escape
  returns focus to the trigger button. `components/site-header.test.tsx`'s
  existing 4 tests still pass unmodified.

**Is there exactly one `<h1>` per page, with no skipped heading levels?**

Checked by hand (`curl | grep -oE '<h[1-6][^>]*>'`) on `/`, `/about`,
`/work/northern-lights`, `/cinematographer` (post-fix), `/contact`. Exactly
one `<h1>` on every page, no skips, after the fix above.

**Do all images have meaningful `alt` text (and decorative ones empty
`alt`)?**

Checked every `<img alt="...">` rendered on `/`, `/about`,
`/work/northern-lights`, `/cinematographer`, `/contact`. All present and
descriptive (project titles, "Northern Lights, still 1"–"4", "Amegah" for
the headshot). No images with a missing or generic alt attribute found. The
homepage's client/partner logos are plain text (`<span>` inside an
`aria-label`'d `<a>`), not images, so no alt-text question applies there.

**Does the reel hero respect `prefers-reduced-motion`? Toggle it and
confirm the video does not play.**

Confirmed with a Playwright script creating two browser contexts — one with
`reducedMotion: 'reduce'`, one with `'no-preference'` — against the live
homepage:

- Reduced motion: `<mux-player>` is **not rendered at all**; a plain static
  `<img>` poster is shown instead (`hasMuxPlayer: false`, `posterImgPresent:
  true`).
- No preference: `<mux-player>` renders with `autoplay` and is actively
  playing (`hasMuxPlayer: true`, `muxAutoplay: true`, `muxPaused: false`).

`components/hero-reel.tsx`'s reduced-motion branch works exactly as
documented — no fix needed here.

**Are the contact links genuinely ≥44px?**

Measured actual rendered `getBoundingClientRect()` at a 390×844 mobile
viewport (not just class names) via Playwright.

- `/contact`'s own three links (email, phone, Instagram): all already
  44px tall (`min-h-11` was already applied). No change needed.
- **Found and fixed: two site-wide touch targets under 44px**, both present
  on every page (footer + header render on every route, so this wasn't
  contact-page-specific, but was caught by the contact-page check):
  - `components/site-footer.tsx`'s email/phone/Instagram links (present in
    the footer on every page, including `/contact`) measured **342×24px**
    (Instagram: 342×17px) — no `min-h-11`. **Fixed**: added
    `inline-flex min-h-11 items-center` to match the pattern already used on
    `/contact`'s own links. Re-measured post-fix: all three now 44px tall.
  - The mobile hamburger `<button aria-label="Menu">` in
    `components/site-header.tsx` measured **39×17px**. **Fixed**: added
    `inline-flex min-h-11 min-w-11 items-center justify-center`. Re-measured
    post-fix: 44×44px.
- **Found, not fixed — logged as outstanding**: the header's `Amegah`
  wordmark link measures 67×28px (height under 44px) on every page. Left
  alone: raising the header's clickable height purely for this link risks
  visually disrupting the header's vertical rhythm (`flex items-center
  justify-between px-6 py-5`) for a brand mark rather than a functional
  contact/nav control, which is a design call outside a verification task's
  "small, contained" bar. Flagged for the next design pass.

## Fixed vs. outstanding — summary

**Fixed in this task** (4 issues, all re-verified after a fresh
`rm -rf .next && npm run build && npm run start`, `npm test`, `npx tsc
--noEmit` all clean):

1. Skipped `<h1>→<h3>` heading level on `/[discipline]` pages
   (`components/project-card.tsx`, `h3` → `h2`).
2. Mobile menu had no focus trap — keyboard Tab escaped onto hidden
   background content (`components/site-header.tsx`).
3. Mobile hamburger button was 39×17px, under the 44px target
   (`components/site-header.tsx`).
4. Footer contact links were 342×17–24px, under the 44px target
   (`components/site-footer.tsx`).

**Fixed in Task 6** (2 items — the exact two LCP root causes this file
flagged as outstanding above):

5. Homepage hero poster now renders as a real, `priority` `next/image` in
   server HTML (`components/home-hero.tsx`), with a Mux-thumbnail fallback
   when no Hero Still is configured. Verified present in production
   `curl`'d HTML plus a matching `<link rel="preload" as="image">`.
6. `/cinematographer`'s (and every discipline page's) first project card
   now loads eagerly at high priority (`components/project-card.tsx`,
   `components/work-browser.tsx`, `priority={index === 0}`); every later
   card stays lazy. `lcp-discovery-insight` for this page now passes
   cleanly (was failing). `featured-work.tsx` deliberately left untouched
   per the brief — its grid is below the homepage hero, not the LCP
   candidate there.

**Still outstanding** (4 items — 2 carried over unfixed, 1 downgraded to
a *new* root cause found during Task 6, 1 unchanged design item):

1. **Homepage LCP is still failing (8.0s–8.5s under `simulate`, 15.6s under
   `devtools` — worse than Task 5's original 5.7s–8.4s reading)**, but the
   root cause has changed: the poster fix above is real and verified, but
   Lighthouse's recorded LCP element is now the bare `<video>` inside
   `<mux-player>`'s shadow DOM, which has no `poster` attribute forwarded to
   it by `@mux/mux-player-react` and so becomes its own (slow) LCP candidate
   once the player mounts and decodes a frame, superseding the fast poster
   paint. See "Task 6 update" above for the full trace-based diagnosis.
   Fixing this needs either an upstream/wrapper fix to get `@mux/mux-player-react`
   to set a real `poster` attribute on its native `<video>`, or a different
   mechanism to keep that `<video>` out of LCP contention until playback
   genuinely starts — out of scope for this task.
2. `/cinematographer` LCP is still reported as 3.4s under
   `--throttling-method=simulate` (Task 5's method, unchanged from before),
   even though the fix is verified correct at the DOM level and
   `--throttling-method=devtools` on the same build reports **2.2s — inside
   budget**. This looks like a `simulate`-mode metric-estimation quirk
   (matches the sub-second breakdown-vs-metric mismatch Task 5 already
   flagged), not a failure of the fix itself, but is recorded honestly as an
   unmet number under the methodology this file uses for before/after
   comparison.
3. `/cinematographer` CLS is noisy across runs (0 to 0.256) — not reliably
   reproduced or root-caused in the time available; unchanged by Task 6,
   which did not touch layout/CLS-affecting code.
4. Header `Amegah` wordmark link is 67×28px, under the 44px touch target —
   a design call, not fixed here.

Both LCP misses are logged honestly rather than restated as passes; the
budget (§7.4: LCP < 2.5s, CLS < 0.1) is genuinely not met on either measured
page under the `simulate` methodology used throughout this file, on real
production builds, even under the most favorable local network/CPU
conditions. `/cinematographer` is inside budget under a trace-based
(`devtools`) measurement of the same build; `/` is not, under either
method.
