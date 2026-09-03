# Amegah Portfolio — Phase 6: Polish

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The final planned phase — motion, mobile art direction, the editorial grid's varied heights, social share images, and a verification pass against the performance budget and accessibility.

**Architecture:** Mostly additive. One new client component for scroll reveals, one for art-directed covers. The editorial cadence stops using a fixed aspect ratio and follows each image's real shape. Verification is measurement, not code.

**Tech Stack:** Next.js 16 (App Router, Cache Components, PPR), React 19.2, TypeScript, Tailwind CSS v4, Sanity v5, Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-01-amegah-portfolio-design.md` (§5.3 motion, §6.3 cadence, §7.2 images, §7.4 performance, §8 mobile, §11 phase 6)
**Builds on:** Phases 1–5, all merged to `main`. The dataset now holds placeholder content, so this is the first phase that can be verified against a populated site.

## Spec-diff pass

Standing requirement since Phase 4's plan dropped two spec elements silently: enumerate every element this phase owns and mark it built or deferred, before execution. Each row below was checked against the actual code, not from memory.

| Spec element | State found | Decision |
|---|---|---|
| §5.3 IntersectionObserver reveals (fade + 8px rise) | No `IntersectionObserver` anywhere | **Build** (Task 1) |
| §5.3 Respect `prefers-reduced-motion` | `app/globals.css:165` kills animations/transitions globally | **Already built** — Task 1 must also gate the observer itself, since a CSS rule cannot stop JS adding a class |
| §5.3 Nav hairline underline transitions | Present in `site-header.tsx` | **Already built** |
| §5.3 No parallax / scroll-jacking / cursor effects | None present | **Nothing to do** — and nothing in this phase may add any |
| §6.3 `editorial` cadence — mixed portrait/landscape, varied heights | `lib/cadence.ts:30` pins every card to `aspect-[4/5]` | **Build** (Task 2) |
| §6.3 `cinematic` / `filmstrip` cadences | Built in `lib/cadence.ts` | **Already built** |
| §7.2 `mobileCoverImage` art direction | Fetched in `queries.ts`/`content.ts`, used by **no component** | **Build** (Task 3) |
| §7.2 LQIP, hotspot crops, Sanity CDN via `next/image` | Built throughout | **Already built** |
| §8 Full-screen overlay mobile menu | `site-header.tsx:55` | **Already built** |
| §8 ≥44px touch targets | `min-h-11` used at every interactive site | **Already built** — Task 5 verifies |
| §8 Gallery single column on mobile | Every cadence starts `grid-cols-1` | **Already built** |
| §11 Metadata / OG images | Homepage only (`app/page.tsx`); project and discipline pages have title+description, no image | **Build** (Task 4) |
| §7.4 Performance budget (LCP < 2.5s 4G, CLS < 0.1) | Never measured | **Verify** (Task 5) |
| §11 Accessibility check | Never run | **Verify** (Task 5) |
| §7.3 `previewLoop` hover previews | Schema field exists; used by no component | **Deferred — see below** |

### Deferring `previewLoop`, with reasons

The spec sanctions autoplay for "hero loop and hover previews only", so hover previews are genuinely specified. They are still the wrong thing to build now:

1. **It is the one video path that does not go through Mux.** `previewLoop` is a plain Sanity `file`, so each clip is served unoptimised from Sanity's CDN at whatever size the client exported — no adaptive bitrate, no transcoding. A grid of them is exactly the payload §7.4's budget is meant to prevent.
2. **It asks the client for a second asset per project** — a short muted export, separate from the film — which nothing in the brief says they have.
3. **On touch it degrades to nothing.** §8 says hover previews are "replaced by tap", and tap already opens the project.

Recommendation: leave the schema field, build the feature only if the client asks once they have real work in the site, and use Mux for it. Recorded here as a decision, not an omission — this is the element to raise with the user at the end of the phase.

## Global Constraints

- **Next.js 16 with Cache Components.** Never add `generateStaticParams` — over CMS content it hard-errors on an empty dataset (the Phase 3 build break).
- **Design tokens only** — `bg-ground`, `text-ink`, `text-ink-soft`, `text-ink-muted`, `border-hairline`, `bg-hairline`, `font-display`, `.index-meta`, `--measure`. **No ad-hoc colours.** Run `grep -rn "white/\|black/\|bg-\[#\|text-\[#" app components` before every commit; violated twice already.
- **Colour palette (brief §7):** background `#0A0A0A`, text `#FFFFFF`, subtext `#D8D8D3`, grey accents `#8A8A85`. No accent colour.
- **Empty-dataset resilience.** Every page must still render sensibly with no content and never throw. The dataset has placeholders now — that makes it *easier* to forget this, not less important.
- **Touch targets ≥44px.** `min-height` is inert on plain inline elements.
- **CSS-first motion.** §7.4: "No animation library unless a need survives review." Nothing in this phase justifies one.
- **All motion respects `prefers-reduced-motion`**, including JavaScript-driven motion, which the global CSS rule cannot reach.
- **Never commit secrets.**

## Decisions this plan locks in

1. **Reveals are opt-in via a wrapper component**, not a global scroll listener. One `IntersectionObserver` per revealed element, disconnected after firing — no scroll handler, nothing retained.
2. **Elements start visible and are hidden only once JS confirms it can animate them.** If JS fails or is disabled, the site is fully readable. This is the opposite of the common `opacity-0` default, which leaves a blank page when the observer never runs.
3. **Editorial varied heights come from the images themselves**, using the `aspectRatio` already in `SanityImage`, not from alternating hardcoded ratios. The client's own mix of portrait and landscape produces the rhythm §6.3 describes.
4. **Art direction uses `<picture>`, not two `<Image>`s.** Toggling two `next/image` elements with `hidden`/`md:block` makes browsers fetch both — the opposite of the intent. `<picture>` with a `media` source is the correct primitive; the cost is hand-writing `srcset`, `width`/`height` and `loading`, which Task 3 does explicitly.
5. **OG images reuse existing cover images** rather than generating them at runtime with `ImageResponse`. Sanity can already crop to 1200×630, and a generated image would be one more thing to render on every crawl.

---

### Task 1: Reveal-on-scroll motion

**Files:**
- Create: `components/reveal.tsx`
- Create: `components/reveal.test.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Produces: `<Reveal>{children}</Reveal>` — fades and rises its children 8px when they enter the viewport, once.

- [ ] **Step 1: Write the failing tests**

Create `components/reveal.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Reveal } from './reveal'

let observe: ReturnType<typeof vi.fn>
let disconnect: ReturnType<typeof vi.fn>
let trigger: (entries: { isIntersecting: boolean }[]) => void

function mockMatchMedia(reduced: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches: reduced,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  )
}

beforeEach(() => {
  observe = vi.fn()
  disconnect = vi.fn()
  vi.stubGlobal(
    'IntersectionObserver',
    vi.fn().mockImplementation((callback) => {
      trigger = callback
      return { observe, disconnect, unobserve: vi.fn() }
    }),
  )
  mockMatchMedia(false)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Reveal', () => {
  it('always renders its children, so content never depends on the animation', () => {
    render(
      <Reveal>
        <p>A still from the film</p>
      </Reveal>,
    )
    expect(screen.getByText('A still from the film')).toBeInTheDocument()
  })

  it('watches for the element entering the viewport', () => {
    render(
      <Reveal>
        <p>Watched</p>
      </Reveal>,
    )
    expect(observe).toHaveBeenCalled()
  })

  it('marks the element revealed once it enters the viewport', () => {
    render(
      <Reveal>
        <p>Revealed</p>
      </Reveal>,
    )
    trigger([{ isIntersecting: true }])
    expect(screen.getByText('Revealed').parentElement).toHaveAttribute(
      'data-revealed',
      'true',
    )
  })

  it('stops observing after revealing, rather than watching forever', () => {
    render(
      <Reveal>
        <p>Done</p>
      </Reveal>,
    )
    trigger([{ isIntersecting: true }])
    expect(disconnect).toHaveBeenCalled()
  })

  it('never hides anything when the visitor asked for reduced motion', () => {
    mockMatchMedia(true)
    render(
      <Reveal>
        <p>No motion</p>
      </Reveal>,
    )
    expect(screen.getByText('No motion').parentElement).toHaveAttribute(
      'data-revealed',
      'true',
    )
    expect(observe).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run components/reveal.test.tsx`
Expected: FAIL — cannot resolve `./reveal`.

- [ ] **Step 3: Implement it**

Create `components/reveal.tsx`:

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Fades and rises its children into view once (spec §5.3).
 *
 * The element starts REVEALED and is hidden only after JavaScript has
 * confirmed it can animate it. If JS never runs, the observer never fires, or
 * the visitor prefers reduced motion, the content is simply visible — the
 * failure mode of the usual `opacity-0` default is a permanently blank page.
 *
 * One observer per element, disconnected the moment it fires: no scroll
 * handler, nothing retained after the reveal.
 */
export function Reveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(true)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Guard for environments without the API rather than shipping a broken
    // hidden state to them.
    if (typeof IntersectionObserver === 'undefined') return

    const element = ref.current
    if (!element) return

    setRevealed(false)

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} data-revealed={revealed} className="reveal">
      {children}
    </div>
  )
}
```

- [ ] **Step 4: Add the CSS**

In `app/globals.css`, after the existing utility classes, add:

```css
/* Spec 5.3: media fades and rises 8px as it enters the viewport. Driven by
   a data attribute so the JS only toggles state and CSS owns the motion.
   The reduced-motion block below already flattens the duration, and
   components/reveal.tsx additionally never hides anything in that case. */
.reveal {
  opacity: 1;
  transform: none;
  transition:
    opacity 700ms ease-out,
    transform 700ms ease-out;
}

.reveal[data-revealed='false'] {
  opacity: 0;
  transform: translateY(8px);
}
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run components/reveal.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 6: Apply it to media**

Wrap the revealing elements — the featured items in `components/featured-work.tsx`, the triptych cards in `components/practices.tsx`, and the gallery figures in `components/project-gallery.tsx`. Do **not** wrap the hero, the site header, or anything above the fold: revealing content that is already on screen at load is a flash, not an effect.

Run `npm test` after wiring; existing component tests must still pass.

- [ ] **Step 7: Commit**

```bash
git add components/reveal.tsx components/reveal.test.tsx app/globals.css components/
git commit -m "Reveal media as it enters the viewport"
```

---

### Task 2: Editorial cadence — varied heights

**Files:**
- Modify: `lib/cadence.ts`
- Modify: `lib/cadence.test.ts`
- Modify: `components/project-card.tsx`

**Interfaces:**
- Produces: `CadenceLayout.aspect` becomes optional. When absent, the card sizes itself from the image's own `aspectRatio`.

Spec §6.3 asks the editorial rhythm for "mixed portrait/landscape, varied heights". Every card is currently pinned to `aspect-[4/5]`, so a photographer's landscape work is cropped to portrait and every row is the same height.

- [ ] **Step 1: Write the failing test**

Append to `lib/cadence.test.ts`:

```ts
describe('editorial cadence', () => {
  it('pins no aspect ratio, so cards take the shape of the photograph', () => {
    expect(cadenceLayout('editorial').aspect).toBeUndefined()
  })

  it('still pins one for the film cadences, whose rhythm is the point', () => {
    expect(cadenceLayout('cinematic').aspect).toBe('aspect-video')
    expect(cadenceLayout('filmstrip').aspect).toBe('aspect-[3/2]')
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run lib/cadence.test.ts`
Expected: FAIL — editorial's aspect is `aspect-[4/5]`.

- [ ] **Step 3: Make the aspect optional**

In `lib/cadence.ts`, change the type to `aspect?: string`, update the doc comment, and drop the `aspect` key from `editorial` only. Add a comment on `editorial` explaining that omitting it is deliberate — the varied heights of §6.3 come from the images.

- [ ] **Step 4: Use the image's own ratio in the card**

In `components/project-card.tsx`, where the image wrapper currently applies `layout.aspect`, fall back to the image's real ratio when the cadence pins none:

```tsx
const ratio = layout.aspect
  ? undefined
  : project.coverImage?.aspectRatio
```

Apply `className={layout.aspect ?? ''}` and, when `ratio` is set, `style={{ aspectRatio: String(ratio) }}`. When neither exists — an image with no `aspectRatio` in its metadata — fall back to `aspect-[4/5]` so the card can never collapse to zero height.

Read the file before editing; keep every existing class on that wrapper.

- [ ] **Step 5: Verify**

Run: `npm test && npx tsc --noEmit`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/cadence.ts lib/cadence.test.ts components/project-card.tsx
git commit -m "Let the editorial grid take its rhythm from the photographs"
```

---

### Task 3: Mobile art direction

**Files:**
- Create: `components/cover-image.tsx`
- Create: `components/cover-image.test.tsx`
- Modify: `components/project-card.tsx`
- Modify: `components/project-hero.tsx`

**Interfaces:**
- Produces: `<CoverImage image mobileImage alt sizes priority className />` — renders `mobileImage` below 768px and `image` above, as real art direction.

Spec §7.2 and §8 both call for `mobileCoverImage` as art direction — a portrait-friendly crop the client uploads, not a resize. The field is fetched already and used nowhere.

- [ ] **Step 1: Write the failing tests**

Create `components/cover-image.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CoverImage } from './cover-image'
import type { SanityImage } from '@/sanity/lib/content'

const wide = { asset: { _ref: 'image-abc-2400x1350-jpg' }, aspectRatio: 1.78 } as SanityImage
const tall = { asset: { _ref: 'image-def-1080x1350-jpg' }, aspectRatio: 0.8 } as SanityImage

describe('CoverImage', () => {
  it('renders the image', () => {
    const { container } = render(<CoverImage image={wide} alt="A still" />)
    expect(container.querySelector('img')).toHaveAttribute('alt', 'A still')
  })

  it('offers the mobile crop to narrow screens when the client uploaded one', () => {
    const { container } = render(
      <CoverImage image={wide} mobileImage={tall} alt="A still" />,
    )
    const source = container.querySelector('source')
    expect(source).toHaveAttribute('media', '(max-width: 767px)')
  })

  it('offers no alternate source when there is no mobile crop', () => {
    const { container } = render(<CoverImage image={wide} alt="A still" />)
    expect(container.querySelector('source')).toBeNull()
  })

  it('lazy-loads by default so a grid of covers is not fetched at once', () => {
    const { container } = render(<CoverImage image={wide} alt="A still" />)
    expect(container.querySelector('img')).toHaveAttribute('loading', 'lazy')
  })

  it('loads eagerly when it is the page’s hero', () => {
    const { container } = render(<CoverImage image={wide} alt="A still" priority />)
    const img = container.querySelector('img')
    expect(img).toHaveAttribute('loading', 'eager')
    expect(img).toHaveAttribute('fetchpriority', 'high')
  })

  it('reserves layout space so the page does not shift as it loads', () => {
    const { container } = render(<CoverImage image={wide} alt="A still" />)
    const img = container.querySelector('img')
    expect(img).toHaveAttribute('width')
    expect(img).toHaveAttribute('height')
  })

  it('renders nothing without an image, rather than an empty box', () => {
    const { container } = render(<CoverImage alt="A still" />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run components/cover-image.test.tsx`
Expected: FAIL — cannot resolve `./cover-image`.

- [ ] **Step 3: Implement it**

Create `components/cover-image.tsx`. Build `srcset` with `urlFor(...).width(w).auto('format').url()` across a small width ladder (640, 1080, 1600, 2400), and set `width`/`height` from the image's `aspectRatio` (fall back to 16:9) so space is reserved and CLS stays at zero.

Explain in a header comment why this is not `next/image`: art direction needs `<picture>` + `media`, and rendering two `next/image` elements toggled with `hidden`/`md:block` makes browsers fetch both — the opposite of the point. Note that the custom Sanity loader means `next/image` was only providing `srcset`, lazy loading and reserved space here, all of which this writes explicitly.

Keep the LQIP blur: set the wrapper's `background-image` to the `lqip` data URI with `background-size: cover`, so the placeholder still shows.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run components/cover-image.test.tsx`
Expected: PASS (7 tests).

- [ ] **Step 5: Use it**

In `components/project-card.tsx` and `components/project-hero.tsx`, replace the `next/image` cover with `<CoverImage>`, passing `mobileImage={project.mobileCoverImage}`. Keep `priority` on the project hero only. Preserve the existing hotspot `objectPosition` behaviour by passing it through.

Check with `grep -rn "mobileCoverImage" components/` that the field is now actually read.

- [ ] **Step 6: Verify**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add components/cover-image.tsx components/cover-image.test.tsx components/project-card.tsx components/project-hero.tsx
git commit -m "Use the client's mobile crop on phones"
```

---

### Task 4: Social share images

**Files:**
- Modify: `sanity/lib/queries.ts`
- Modify: `sanity/lib/queries.test.ts`
- Modify: `app/work/[slug]/page.tsx`
- Modify: `app/[discipline]/page.tsx`

A link to a project on WhatsApp or Instagram currently previews with no image. Each page already has exactly the right one.

**Defect found while planning — fix this first.** `DISCIPLINE_BY_SLUG_QUERY` projects `_id, title, slug, description, cadence` and **not `coverImage`**, so the discipline page would read `undefined` and silently emit no image. This is the third instance of the same bug class in this project — `DISCIPLINES_QUERY`'s cover in Phase 4, `siteSettings.headshot` in Phase 5 — a field used by a component that the query never fetched. It fails silently every time, which is what makes it worth a test rather than a glance.

- [ ] **Step 0: Project the discipline's cover image**

Append to `sanity/lib/queries.test.ts`:

```ts
describe('DISCIPLINE_BY_SLUG_QUERY', () => {
  it('projects the cover image, which the page needs for its share image', () => {
    expect(DISCIPLINE_BY_SLUG_QUERY).toContain('"coverImage": coverImage{')
  })
})
```

Run it, watch it fail, then add to `DISCIPLINE_BY_SLUG_QUERY` in `sanity/lib/queries.ts`, matching how the neighbouring queries interpolate `IMAGE_FIELDS`:

```
  "coverImage": coverImage{
    ${IMAGE_FIELDS}
  },
```

Confirm `Discipline` in `sanity/lib/content.ts` already types `coverImage` — `DISCIPLINES_QUERY` returns it, so it should. If it does not, add it.

- [ ] **Step 1: Add OG images to the project page**

In `generateMetadata` in `app/work/[slug]/page.tsx`, add an `openGraph` block with the project's cover image at 1200×630 via `urlFor(...).width(1200).height(630).auto('format').url()`, plus `type: 'article'`. Guard on `project.coverImage?.asset` — omit `openGraph.images` entirely when absent rather than passing `undefined`.

Mirror the homepage's existing comment about Next 16 merging metadata with `?? null`, so an explicit `undefined` overwrites rather than inherits.

- [ ] **Step 2: Add OG images to the discipline page**

Same treatment in `app/[discipline]/page.tsx`, using the discipline's `coverImage`.

- [ ] **Step 3: Verify the tags are actually emitted**

Run `npm run build`, then start the production server and check a real page:

```bash
npm run start &
curl -s http://localhost:3000/work/northern-lights | grep -o 'og:image[^>]*'
```

Expected: an `og:image` meta tag pointing at `cdn.sanity.io`. Stop the server. Report what you saw — do not assume the tag is there because the code looks right.

- [ ] **Step 4: Commit**

```bash
git add app/
git commit -m "Give projects and disciplines their own share images"
```

---

### Task 5: Performance and accessibility verification

**Files:**
- Create: `docs/verification-phase-6.md`

This task measures rather than builds. Its deliverable is a document recording what was actually observed, with numbers.

- [ ] **Step 1: Build and serve the production site**

```bash
rm -rf .next && npm run build && npm run start
```

Use the production build, never `npm run dev` — dev is unoptimised, and its `'use cache'` entries can serve pre-seed content (this bit the Phase 5 review).

- [ ] **Step 2: Measure the performance budget**

Run a Lighthouse audit against `/` and `/cinematographer` on a mobile profile. Record **LCP**, **CLS**, **TBT** and the overall performance score for each.

Spec §7.4 requires **LCP < 2.5s** and **CLS < 0.1**. Note that a localhost run flatters LCP — record the number, and say plainly that it is a local measurement, not a 4G one.

- [ ] **Step 3: Run an accessibility audit**

Lighthouse's accessibility category on `/`, `/cinematographer`, `/work/northern-lights` and `/about`. Then check by hand what it cannot:

- Tab through the homepage and the mobile menu. Does focus stay visible, and does the overlay menu trap focus while open?
- Is there exactly one `<h1>` per page, with no skipped heading levels?
- Do all images have meaningful `alt` text (and decorative ones empty `alt`)?
- Does the reel hero respect `prefers-reduced-motion`? Toggle it and confirm the video does not play.
- Are the contact links genuinely ≥44px?

- [ ] **Step 4: Write it up**

Create `docs/verification-phase-6.md` recording, per page: the Lighthouse scores, the three metrics, every accessibility issue found, and for each issue whether it was fixed in this phase or is outstanding. **Record failures honestly** — a budget that is missed is a finding, not something to bury or restate as a pass.

- [ ] **Step 5: Fix what is both real and small**

Fix any issue that is a genuine defect and contained. Anything larger, list in the document as outstanding with a note on what it would take. Do not start a redesign inside a verification task.

- [ ] **Step 6: Commit**

```bash
git add docs/verification-phase-6.md
git commit -m "Record the Phase 6 performance and accessibility verification"
```

---

## Phase 6 done when

- `npm test`, `npx tsc --noEmit`, `npm run lint` and `npm run build` are all clean
- Media fades and rises into view, and does not move at all under `prefers-reduced-motion`
- The site is fully readable with JavaScript disabled — no element is left invisible by a reveal that never fired
- A photographer's landscape and portrait work sit in the same grid at their own shapes
- `mobileCoverImage` is actually used, and a phone fetches only the mobile crop
- Sharing a project link previews with that project's cover image
- `docs/verification-phase-6.md` records real measured numbers, including any the site misses

## What Phase 6 deliberately leaves out

`previewLoop` hover previews, for the three reasons given in the spec-diff pass above — raise with the user rather than treating as done. Everything else in §11's phase 6 is built or verified here.

---

### Task 6 (added post-verification): Close the two LCP failures Task 5 found

Task 5's Lighthouse runs missed the spec's LCP < 2.5s budget by 2-3x on both measured pages. Both root causes were independently confirmed in source by task review, not inferred from Lighthouse noise alone, and both are narrow enough to fix without a redesign.

**Files:**
- Modify: `components/home-hero.tsx`
- Modify: `components/project-card.tsx`
- Modify: `components/project-card.test.tsx`
- Modify: `components/work-browser.tsx`

**Root cause 1 — homepage hero has no poster in server HTML.** `HomeHero` loads `HeroReel` via `next/dynamic({ ssr: false })`, so nothing in that subtree exists until JavaScript hydrates and fetches the ~1MB player chunk — no `<img>`, nothing. The LCP element (the poster frame) is undiscoverable until then.

Fix: render a real, `priority` `next/image` poster in `HomeHero` itself — which DOES server-render, since only the inner `HeroReel` import is `ssr: false` — stacked behind where `HeroReel` mounts. Once hydrated, `MuxPlayer`'s own `poster` prop paints the identical image, so there is no visible change; only the *first paint* moves from "nothing" to "the real poster, in the initial HTML."

Currently `poster` comes only from `posterUrl(still)`, i.e. `settings.heroImages[0]` — a field that's hidden in Studio whenever `heroVariant !== 'still'`, so a client who only ever configured the reel treatment may have never set it, leaving `poster` undefined. Add a fallback to Mux's own public, unauthenticated thumbnail CDN — no extra fetch needed, it's pure string construction from the `playbackId` already in hand:

```ts
const muxPoster = playbackId
  ? `https://image.mux.com/${playbackId}/thumbnail.jpg?width=2400&fit_mode=smartcrop`
  : undefined
const poster = posterUrl(still) ?? muxPoster
```

Then, inside the `showReel` branch, render the poster image ahead of `<HeroReel>`:

```tsx
{showReel && (
  <div className="absolute inset-0 bg-hairline">
    {poster && (
      <Image
        src={poster}
        alt={name}
        fill
        priority
        sizes="100vw"
        placeholder={still?.lqip ? 'blur' : 'empty'}
        blurDataURL={still?.lqip}
        style={still ? { objectPosition: hotspotPosition(still) } : undefined}
        className="object-cover"
      />
    )}
    <HeroReel playbackId={playbackId} poster={poster} />
  </div>
)}
```

Note `still` may be undefined when the poster comes from the Mux fallback — guard `hotspotPosition`/`lqip` accordingly, exactly as written above. `next.config.ts` already lists `image.mux.com` in `remotePatterns`, and the custom Sanity image loader (`lib/sanity-image-loader.ts`) passes any non-`cdn.sanity.io` URL through unmodified, so this needs no config change.

**Root cause 2 — the first above-the-fold project card is unconditionally lazy.** `CoverImage` already accepts a `priority` prop (defaults `false` → `loading="lazy"`), but `ProjectCard` never accepts or forwards one, so every card on every discipline page — including the first, which sits directly under the page heading with no hero above it — loads lazily.

Fix: thread `priority` through.

```ts
// project-card.tsx — add to the props type and forward it
priority?: boolean
// ...
<CoverImage
  image={image}
  mobileImage={project.mobileCoverImage}
  alt={project.title}
  sizes={sizes ?? layout.sizes}
  priority={priority}
  className="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
/>
```

```tsx
// work-browser.tsx — only the very first rendered card is above the fold
<ProjectCard
  key={project._id}
  project={project}
  index={index}
  cadence={cadence}
  priority={index === 0}
/>
```

**Deliberately NOT touched: `featured-work.tsx`.** Its grid sits below the homepage hero (which occupies 70-85vh), so its first item is not the LCP candidate there, and Task 5 never measured or confirmed a problem on that page. Forcing `priority` on an off-screen image would spend LCP-priority bandwidth on the wrong element. Scope this fix to what was actually measured.

- [ ] Write a failing test in `project-card.test.tsx` asserting that `priority={true}` produces `loading="eager"`/`fetchpriority="high"` on the rendered `<img>`, and that the default (`priority` omitted) still produces `loading="lazy"` — pin both directions so this can't silently regress either way.
- [ ] Run it, watch it fail, implement, run again.
- [ ] Manually verify in a real browser: reload `/` and confirm the poster paints immediately (view source / disable JS should still show an `<img>` for the hero); reload `/cinematographer` and confirm only the first card's image has `loading="eager"` in the DOM, the rest stay `lazy`.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint`, `rm -rf .next && npm run build` all clean.
- [ ] Re-run the two Lighthouse checks from Task 5 (`/` and `/cinematographer`, mobile profile) and record the before/after LCP numbers in `docs/verification-phase-6.md` — update its "outstanding" section to reflect what's now fixed, or explain honestly if the numbers still miss budget and why.
- [ ] Commit.
