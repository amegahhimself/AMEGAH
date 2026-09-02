# Amegah Portfolio — Phase 2: Work Browsing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the discipline pages — a filterable, URL-synced grid of project cards that renders in each discipline's own grid cadence.

**Architecture:** Each discipline gets a dynamic route `/[discipline]` driven entirely by CMS slugs, so a discipline added in Studio gets a working page with no code change. The server fetches the discipline, its category tree, and **all** its non-archived projects — cached with `use cache` and tagged, so the page is a static shell. Filtering then happens in the browser against that already-loaded list: instant, no refetch, and URL-synced so a filtered view is shareable. The server still reads `searchParams` for the initial render, so a deep link arrives already filtered with no hydration flash.

**Tech Stack:** Next.js 16 (App Router, Cache Components, PPR), React 19.2, TypeScript, Tailwind CSS v4, Sanity v5, Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-01-amegah-portfolio-design.md`
**Builds on:** `docs/superpowers/plans/2026-09-01-amegah-phase-1-foundations.md` (complete)

## Global Constraints

- **Next.js 16 conventions only.** Verified against `node_modules/next/dist/docs/` while writing this plan:
  - `params` and `searchParams` are **Promises**, typed via the generated `PageProps<'/[discipline]'>` helper (and `Pick<PageProps<'/[discipline]'>, 'params'>` for child components). Do not hand-write a props interface.
  - **Never `await params`/`searchParams` at the top of the page component.** Pass the promise into a `<Suspense>`-wrapped child and await it there, so the static shell still prerenders.
  - **Never set the `dynamicParams` route segment config** — it is incompatible with `cacheComponents: true` and hard-errors the build. Params not returned by `generateStaticParams` render on request, which is exactly what a newly-added discipline needs. Call `notFound()` when a param doesn't resolve to real data.
  - `cacheTag` is variadic: `cacheTag('a', 'b')` is valid and is how a query that dereferences several document types stays correct.
- **Disciplines and categories are never hardcoded in application code.** Only `scripts/seed-data.ts` may name them. Routes, nav, and filters all read from Sanity.
- **Design tokens only** — `bg-ground`, `text-ink`, `text-ink-soft`, `text-ink-muted`, `border-hairline`, `font-display`, and the `.index-meta` class. No new colours, no new fonts.
- **Colour palette (client brief §7):** background `#0A0A0A`, main text `#FFFFFF`, off-white subtext `#D8D8D3`, grey accents `#8A8A85`. No accent colour.
- **Touch targets ≥44px** and no hover-only affordances — every hover behaviour needs a tap equivalent (client brief §5).
- **Never commit secrets.** `.env.local` stays gitignored.

## Decisions this plan locks in

1. **All projects for a discipline are fetched server-side, once, cached.** Filtering is then in-memory in the browser. A portfolio's per-discipline project count is in the tens-to-low-hundreds, and the card projection is small metadata (image refs, not image data), so this is a few KB of JSON in exchange for instant filtering and a fully static page. **Revisit if any single discipline exceeds ~300 projects** — at that point the filter should move server-side with its own cached query per category.
2. **`?category=` and `?type=` query params**, per spec §6.2 — not path segments. One canonical page per discipline; categories are filters over it, not separate collections.
3. **Cards link to `/work/[slug]`, which does not exist until Phase 3.** Those links 404 in the interim. This is deliberate — the alternative is building throwaway link handling and reworking it next phase. Phase 2 is not deployed to production on its own.
4. **`mobileCoverImage` art direction is deferred to Phase 6's mobile pass**, and is recorded there rather than half-built here. Cards in this phase use `coverImage` with **hotspot-aware `object-position`** plus per-cadence aspect ratios, which is what actually addresses the brief's "image cropping" concern for grid thumbnails — the focal point is respected at every crop. Rendering two `<Image>` elements to swap sources at a breakpoint causes both to download in most browsers, so it is not worth doing until there are real assets to tune against.

---

### Task 1: Queries and cached data layer for discipline pages

**Files:**
- Modify: `sanity/lib/queries.ts`
- Modify: `sanity/lib/queries.test.ts`
- Modify: `sanity/lib/content.ts`

**Interfaces:**
- Consumes: `TAGS` from `sanity/lib/tags.ts`, `client` from `sanity/lib/client.ts`, `FlatCategory` from `lib/categories.ts` (all Phase 1).
- Produces:
  - `DISCIPLINE_BY_SLUG_QUERY`, `CATEGORIES_BY_DISCIPLINE_QUERY` (strings), and an extended `PROJECT_CARD_PROJECTION`
  - `type Cadence = 'cinematic' | 'filmstrip' | 'editorial'`
  - `type SanityImage = { asset?: { _ref: string }; hotspot?: { x: number; y: number }; lqip?: string; aspectRatio?: number }`
  - `type ProjectCardData = { _id, title, slug, year?, coverImage?, mobileCoverImage?, discipline: {title, slug, cadence}, category: {title, slug, parentSlug: string | null} }`
  - `getDisciplineBySlug(slug: string): Promise<Discipline | null>`
  - `getCategoriesForDiscipline(disciplineSlug: string): Promise<FlatCategory[]>`
  - `getProjectsForDiscipline(disciplineSlug: string): Promise<ProjectCardData[]>`

- [ ] **Step 1: Write the failing tests**

Append to `sanity/lib/queries.test.ts` (keep the existing 5 tests — they must still pass), and add the new imports to the existing import line:

```ts
import {
  CATEGORIES_BY_DISCIPLINE_QUERY,
  DISCIPLINE_BY_SLUG_QUERY,
  PROJECT_CARD_PROJECTION,
  projectListQuery,
} from './queries'

describe('DISCIPLINE_BY_SLUG_QUERY', () => {
  it('looks up a single discipline by slug', () => {
    expect(DISCIPLINE_BY_SLUG_QUERY).toContain('_type == "discipline"')
    expect(DISCIPLINE_BY_SLUG_QUERY).toContain('slug.current == $slug')
    expect(DISCIPLINE_BY_SLUG_QUERY).toContain('[0]')
  })

  it('returns the cadence that drives the grid layout', () => {
    expect(DISCIPLINE_BY_SLUG_QUERY).toContain('cadence')
  })
})

describe('CATEGORIES_BY_DISCIPLINE_QUERY', () => {
  it('scopes categories to one discipline', () => {
    expect(CATEGORIES_BY_DISCIPLINE_QUERY).toContain(
      'discipline->slug.current == $disciplineSlug',
    )
  })

  it('projects parentId so the tree helper can nest sub-categories', () => {
    expect(CATEGORIES_BY_DISCIPLINE_QUERY).toContain('"parentId": parent._ref')
  })

  it('orders by the editor-defined rank', () => {
    expect(CATEGORIES_BY_DISCIPLINE_QUERY).toContain('order(orderRank)')
  })
})

describe('PROJECT_CARD_PROJECTION', () => {
  it('exposes the parent category slug so a parent filter can match its children', () => {
    expect(PROJECT_CARD_PROJECTION).toContain('parentSlug')
  })

  it('includes LQIP metadata for blur placeholders', () => {
    expect(PROJECT_CARD_PROJECTION).toContain('lqip')
  })

  it('includes the image hotspot so crops respect the focal point', () => {
    expect(PROJECT_CARD_PROJECTION).toContain('hotspot')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run sanity/lib/queries.test.ts`
Expected: FAIL — `DISCIPLINE_BY_SLUG_QUERY` and `CATEGORIES_BY_DISCIPLINE_QUERY` are not exported; `PROJECT_CARD_PROJECTION` has no `parentSlug`/`lqip`/`hotspot`.

- [ ] **Step 3: Extend the queries**

Replace `PROJECT_CARD_PROJECTION` in `sanity/lib/queries.ts` and append the two new queries. Leave `projectListQuery`, `DISCIPLINES_QUERY`, and `SITE_SETTINGS_QUERY` unchanged.

```ts
export const IMAGE_PROJECTION = `{
  asset,
  hotspot,
  "lqip": asset->metadata.lqip,
  "aspectRatio": asset->metadata.dimensions.aspectRatio
}`

export const PROJECT_CARD_PROJECTION = `{
  _id,
  title,
  "slug": slug.current,
  year,
  "coverImage": coverImage${IMAGE_PROJECTION},
  "mobileCoverImage": mobileCoverImage${IMAGE_PROJECTION},
  "discipline": discipline->{title, "slug": slug.current, cadence},
  "category": category->{
    title,
    "slug": slug.current,
    "parentSlug": parent->slug.current
  }
}`

export const DISCIPLINE_BY_SLUG_QUERY = `*[_type == "discipline" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  description,
  cadence
}`

export const CATEGORIES_BY_DISCIPLINE_QUERY = `*[_type == "category" && discipline->slug.current == $disciplineSlug] | order(orderRank) {
  _id,
  title,
  "slug": slug.current,
  "parentId": parent._ref
}`
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run sanity/lib/queries.test.ts`
Expected: PASS (5 existing + 8 new = 13 tests).

- [ ] **Step 5: Add the types and cached data functions**

In `sanity/lib/content.ts`, add these imports to the existing ones:

```ts
import type { FlatCategory } from '@/lib/categories'
import {
  CATEGORIES_BY_DISCIPLINE_QUERY,
  DISCIPLINE_BY_SLUG_QUERY,
  projectListQuery,
} from './queries'
```

Then add the types and functions (keep everything already in the file):

```ts
export type Cadence = 'cinematic' | 'filmstrip' | 'editorial'

export type SanityImage = {
  asset?: { _ref: string }
  hotspot?: { x: number; y: number }
  lqip?: string
  aspectRatio?: number
}

export type ProjectCardData = {
  _id: string
  title: string
  slug: string
  year?: number
  coverImage?: SanityImage
  mobileCoverImage?: SanityImage
  discipline: { title: string; slug: string; cadence: Cadence }
  category: { title: string; slug: string; parentSlug: string | null } | null
}

export async function getDisciplineBySlug(slug: string): Promise<Discipline | null> {
  'use cache'
  cacheTag(TAGS.discipline)
  cacheLife('max')
  return client.fetch<Discipline | null>(DISCIPLINE_BY_SLUG_QUERY, { slug })
}

export async function getCategoriesForDiscipline(
  disciplineSlug: string,
): Promise<FlatCategory[]> {
  'use cache'
  // Dereferences the discipline, so a discipline rename must invalidate this too.
  cacheTag(TAGS.category, TAGS.discipline)
  cacheLife('max')
  return client.fetch<FlatCategory[]>(CATEGORIES_BY_DISCIPLINE_QUERY, { disciplineSlug })
}

export async function getProjectsForDiscipline(
  disciplineSlug: string,
): Promise<ProjectCardData[]> {
  'use cache'
  // The card projection dereferences discipline and category, so renaming
  // either must invalidate this list, not just editing a project.
  cacheTag(TAGS.project, TAGS.category, TAGS.discipline)
  cacheLife('max')
  return client.fetch<ProjectCardData[]>(projectListQuery({ disciplineSlug }), {
    disciplineSlug,
  })
}
```

Also widen the existing `Discipline` type's `cadence` field to use the new alias — change `cadence: 'cinematic' | 'filmstrip' | 'editorial'` to `cadence: Cadence` so there is one definition of the union.

- [ ] **Step 6: Verify the suite and types**

Run: `npm test && npx tsc --noEmit`
Expected: all tests PASS. `tsc` reports only the pre-existing unrelated `app/layout.tsx` `LayoutProps` error, nothing new.

- [ ] **Step 7: Commit**

```bash
git add sanity/lib/
git commit -m "Add discipline, category, and project queries for work browsing"
```

---

### Task 2: Cadence layout mapping

**Files:**
- Create: `lib/cadence.ts`
- Create: `lib/cadence.test.ts`

**Interfaces:**
- Consumes: `Cadence` from `sanity/lib/content.ts` (Task 1).
- Produces: `cadenceLayout(cadence: Cadence | undefined): { grid: string; aspect: string; sizes: string }` — Tailwind class strings and an `<Image sizes>` value per cadence. This is spec §6.3's "same design language, different rhythm" expressed as data.

- [ ] **Step 1: Write the failing test**

Create `lib/cadence.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { cadenceLayout } from './cadence'

describe('cadenceLayout', () => {
  it('gives Director work the largest, widest presentation', () => {
    const layout = cadenceLayout('cinematic')
    expect(layout.aspect).toBe('aspect-video')
    expect(layout.grid).toContain('md:grid-cols-2')
    expect(layout.grid).not.toContain('grid-cols-3')
  })

  it('gives Cinematography a denser filmstrip rhythm', () => {
    const layout = cadenceLayout('filmstrip')
    expect(layout.grid).toContain('lg:grid-cols-3')
    expect(layout.aspect).toBe('aspect-[3/2]')
  })

  it('gives Photography a portrait-led editorial rhythm', () => {
    const layout = cadenceLayout('editorial')
    expect(layout.grid).toContain('lg:grid-cols-3')
    expect(layout.aspect).toBe('aspect-[4/5]')
  })

  it('starts every cadence at one column so mobile is single-column', () => {
    for (const cadence of ['cinematic', 'filmstrip', 'editorial'] as const) {
      expect(cadenceLayout(cadence).grid).toContain('grid-cols-1')
    }
  })

  it('falls back to editorial for a discipline with no cadence set', () => {
    expect(cadenceLayout(undefined)).toEqual(cadenceLayout('editorial'))
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/cadence.test.ts`
Expected: FAIL — cannot resolve `./cadence`.

- [ ] **Step 3: Implement the mapping**

Create `lib/cadence.ts`:

```ts
import type { Cadence } from '@/sanity/lib/content'

export type CadenceLayout = {
  /** Tailwind grid classes for the project grid. */
  grid: string
  /** Tailwind aspect-ratio class for each card's image. */
  aspect: string
  /** The `sizes` attribute for next/image, matching the grid's columns. */
  sizes: string
}

/**
 * Each discipline reads in the same visual language but a different rhythm
 * (spec section 6.3). Every cadence starts single-column so phones get one
 * project at a time rather than a squeezed desktop grid.
 */
const LAYOUTS: Record<Cadence, CadenceLayout> = {
  cinematic: {
    grid: 'grid grid-cols-1 gap-x-8 gap-y-20 md:grid-cols-2',
    aspect: 'aspect-video',
    sizes: '(min-width: 768px) 50vw, 100vw',
  },
  filmstrip: {
    grid: 'grid grid-cols-1 gap-x-3 gap-y-10 sm:grid-cols-2 lg:grid-cols-3',
    aspect: 'aspect-[3/2]',
    sizes: '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
  },
  editorial: {
    grid: 'grid grid-cols-1 gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-3',
    aspect: 'aspect-[4/5]',
    sizes: '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
  },
}

export function cadenceLayout(cadence: Cadence | undefined): CadenceLayout {
  return (cadence && LAYOUTS[cadence]) || LAYOUTS.editorial
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/cadence.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/cadence.ts lib/cadence.test.ts
git commit -m "Add per-discipline grid cadence layouts"
```

---

### Task 3: Project card

**Files:**
- Create: `lib/card-meta.ts`
- Create: `lib/card-meta.test.ts`
- Create: `components/project-card.tsx`
- Create: `components/project-card.test.tsx`

**Interfaces:**
- Consumes: `cadenceLayout` (Task 2), `ProjectCardData`/`SanityImage` (Task 1), `urlFor` from `sanity/lib/image.ts` (pre-existing).
- Produces:
  - `indexLabel({ index, category, year }): string` — the archival device from spec §5.2, e.g. `01 — Music Videos — 2025`
  - `hotspotPosition(image?: SanityImage): string` — a CSS `object-position` value from Sanity's hotspot
  - `<ProjectCard project={...} index={n} cadence={...} />`

- [ ] **Step 1: Write the failing tests for the pure helpers**

Create `lib/card-meta.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { hotspotPosition, indexLabel } from './card-meta'

describe('indexLabel', () => {
  it('renders the archival index form', () => {
    expect(indexLabel({ index: 0, category: 'Music Videos', year: 2025 })).toBe(
      '01 — Music Videos — 2025',
    )
  })

  it('keeps counting past nine without losing the padding', () => {
    expect(indexLabel({ index: 11, category: 'Ads', year: 2024 })).toBe('12 — Ads — 2024')
  })

  it('omits a missing year rather than printing undefined', () => {
    expect(indexLabel({ index: 2, category: 'Portraits' })).toBe('03 — Portraits')
  })

  it('omits a missing category', () => {
    expect(indexLabel({ index: 0, year: 2025 })).toBe('01 — 2025')
  })

  it('still labels a project with neither category nor year', () => {
    expect(indexLabel({ index: 4 })).toBe('05')
  })
})

describe('hotspotPosition', () => {
  it('centres an image that has no hotspot', () => {
    expect(hotspotPosition(undefined)).toBe('50% 50%')
    expect(hotspotPosition({})).toBe('50% 50%')
  })

  it('converts a Sanity hotspot into a CSS object-position', () => {
    expect(hotspotPosition({ hotspot: { x: 0.25, y: 0.75 } })).toBe('25% 75%')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/card-meta.test.ts`
Expected: FAIL — cannot resolve `./card-meta`.

- [ ] **Step 3: Implement the helpers**

Create `lib/card-meta.ts`:

```ts
import type { SanityImage } from '@/sanity/lib/content'

/**
 * The archival index device from spec section 5.2 — `01 — Music Videos — 2025`.
 * Missing parts are dropped rather than printed empty.
 */
export function indexLabel({
  index,
  category,
  year,
}: {
  index: number
  category?: string
  year?: number
}): string {
  const parts: string[] = [String(index + 1).padStart(2, '0')]
  if (category) parts.push(category)
  if (year) parts.push(String(year))
  return parts.join(' — ')
}

/**
 * Turns Sanity's hotspot into a CSS object-position, so a cropped card keeps
 * the subject in frame at every aspect ratio (client brief section 5).
 */
export function hotspotPosition(image?: SanityImage): string {
  const x = image?.hotspot?.x ?? 0.5
  const y = image?.hotspot?.y ?? 0.5
  return `${+(x * 100).toFixed(2)}% ${+(y * 100).toFixed(2)}%`
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/card-meta.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Write the failing test for the card**

Create `components/project-card.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ProjectCard } from './project-card'
import type { ProjectCardData } from '@/sanity/lib/content'

const project: ProjectCardData = {
  _id: 'p1',
  title: 'Nightfall',
  slug: 'nightfall',
  year: 2025,
  coverImage: { asset: { _ref: 'image-abc-1600x900-jpg' }, hotspot: { x: 0.5, y: 0.5 } },
  discipline: { title: 'Director', slug: 'director', cadence: 'cinematic' },
  category: { title: 'Music Videos', slug: 'music-videos', parentSlug: null },
}

describe('ProjectCard', () => {
  it('links to the project page', () => {
    render(<ProjectCard project={project} index={0} cadence="cinematic" />)
    expect(screen.getByRole('link', { name: /Nightfall/ })).toHaveAttribute(
      'href',
      '/work/nightfall',
    )
  })

  it('shows the title and the archival index line', () => {
    render(<ProjectCard project={project} index={0} cadence="cinematic" />)
    expect(screen.getByText('Nightfall')).toBeInTheDocument()
    expect(screen.getByText('01 — Music Videos — 2025')).toBeInTheDocument()
  })

  it('renders a project with no image without crashing', () => {
    render(
      <ProjectCard
        project={{ ...project, coverImage: undefined }}
        index={0}
        cadence="cinematic"
      />,
    )
    expect(screen.getByText('Nightfall')).toBeInTheDocument()
  })

  it('renders a project with no category', () => {
    render(
      <ProjectCard project={{ ...project, category: null }} index={2} cadence="editorial" />,
    )
    expect(screen.getByText('03 — 2025')).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npx vitest run components/project-card.test.tsx`
Expected: FAIL — cannot resolve `./project-card`.

- [ ] **Step 7: Implement the card**

Create `components/project-card.tsx`:

```tsx
import Image from 'next/image'
import Link from 'next/link'

import { cadenceLayout } from '@/lib/cadence'
import { hotspotPosition, indexLabel } from '@/lib/card-meta'
import type { Cadence, ProjectCardData } from '@/sanity/lib/content'
import { urlFor } from '@/sanity/lib/image'

export function ProjectCard({
  project,
  index,
  cadence,
}: {
  project: ProjectCardData
  index: number
  cadence: Cadence
}) {
  const layout = cadenceLayout(cadence)
  const image = project.coverImage

  return (
    <Link href={`/work/${project.slug}`} className="group block">
      <div className={`relative overflow-hidden bg-white/5 ${layout.aspect}`}>
        {image?.asset ? (
          <Image
            src={urlFor(image).width(1600).auto('format').url()}
            alt={project.title}
            fill
            sizes={layout.sizes}
            placeholder={image.lqip ? 'blur' : 'empty'}
            blurDataURL={image.lqip}
            style={{ objectPosition: hotspotPosition(image) }}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        ) : null}
      </div>

      <p className="index-meta mt-4">
        {indexLabel({
          index,
          category: project.category?.title,
          year: project.year,
        })}
      </p>
      <h3 className="font-display mt-1 text-xl text-ink">{project.title}</h3>
    </Link>
  )
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npx vitest run components/project-card.test.tsx`
Expected: PASS (4 tests).

If `next/image` complains about the remote host in the test environment, confirm `cdn.sanity.io` is in `next.config.ts`'s `images.remotePatterns` (added in Phase 1) — do not add a mock for `next/image`.

- [ ] **Step 9: Commit**

```bash
git add lib/card-meta.ts lib/card-meta.test.ts components/project-card.tsx components/project-card.test.tsx
git commit -m "Add project card with archival index label and hotspot-aware crop"
```

---

### Task 4: Project filtering

**Files:**
- Create: `lib/filter-projects.ts`
- Create: `lib/filter-projects.test.ts`

**Interfaces:**
- Consumes: `ProjectCardData` (Task 1).
- Produces: `filterProjects(projects: ProjectCardData[], filter: { category?: string | null; type?: string | null }): ProjectCardData[]`. Selecting a parent category (Events) must also match projects filed under its children (Corporate, Funerals, …); selecting a `type` narrows to that exact sub-category.

- [ ] **Step 1: Write the failing test**

Create `lib/filter-projects.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { filterProjects } from './filter-projects'
import type { ProjectCardData } from '@/sanity/lib/content'

const make = (
  slug: string,
  category: { slug: string; parentSlug: string | null } | null,
): ProjectCardData => ({
  _id: slug,
  title: slug,
  slug,
  discipline: { title: 'Cinematographer', slug: 'cinematographer', cadence: 'filmstrip' },
  category: category ? { title: category.slug, ...category } : null,
})

const ads = make('an-ad', { slug: 'ads', parentSlug: null })
const corporate = make('a-gala', { slug: 'corporate', parentSlug: 'events' })
const funeral = make('a-funeral', { slug: 'funerals', parentSlug: 'events' })
const uncategorised = make('loose-end', null)
const all = [ads, corporate, funeral, uncategorised]

describe('filterProjects', () => {
  it('returns everything when nothing is selected', () => {
    expect(filterProjects(all, {})).toEqual(all)
    expect(filterProjects(all, { category: null, type: null })).toEqual(all)
  })

  it('matches a top-level category directly', () => {
    expect(filterProjects(all, { category: 'ads' })).toEqual([ads])
  })

  it('includes every sub-category when a parent category is selected', () => {
    expect(filterProjects(all, { category: 'events' })).toEqual([corporate, funeral])
  })

  it('narrows to one sub-category when a type is selected', () => {
    expect(filterProjects(all, { category: 'events', type: 'funerals' })).toEqual([funeral])
  })

  it('returns nothing for a category slug that matches no project', () => {
    expect(filterProjects(all, { category: 'documentaries' })).toEqual([])
  })

  it('never includes an uncategorised project in a filtered view', () => {
    expect(filterProjects(all, { category: 'ads' })).not.toContain(uncategorised)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/filter-projects.test.ts`
Expected: FAIL — cannot resolve `./filter-projects`.

- [ ] **Step 3: Implement the filter**

Create `lib/filter-projects.ts`:

```ts
import type { ProjectCardData } from '@/sanity/lib/content'

export type ProjectFilter = {
  category?: string | null
  type?: string | null
}

/**
 * Filters the already-loaded project list in the browser.
 *
 * Selecting a parent category (Events) includes everything filed under it,
 * because a visitor asking for Events means "all event work", not "work filed
 * on the parent itself". Selecting a type narrows to that exact sub-category.
 */
export function filterProjects(
  projects: ProjectCardData[],
  { category, type }: ProjectFilter,
): ProjectCardData[] {
  if (type) {
    return projects.filter((project) => project.category?.slug === type)
  }
  if (category) {
    return projects.filter(
      (project) =>
        project.category?.slug === category || project.category?.parentSlug === category,
    )
  }
  return projects
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/filter-projects.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/filter-projects.ts lib/filter-projects.test.ts
git commit -m "Add project filtering with parent-category matching"
```

---

### Task 5: Category filter bar

**Files:**
- Create: `components/category-filter-bar.tsx`
- Create: `components/category-filter-bar.test.tsx`

**Interfaces:**
- Consumes: `CategoryNode` from `lib/categories.ts` (Phase 1).
- Produces: `<CategoryFilterBar categories={CategoryNode[]} activeCategory={string | null} activeType={string | null} onChange={(next: { category: string | null; type: string | null }) => void} />` — a **presentational** Client Component. It owns no state and no router access; the parent (Task 6) owns both. A second row of sub-category pills appears only when the active category has children.

- [ ] **Step 1: Write the failing test**

Create `components/category-filter-bar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CategoryFilterBar } from './category-filter-bar'
import type { CategoryNode } from '@/lib/categories'

const node = (slug: string, children: CategoryNode[] = []): CategoryNode => ({
  _id: slug,
  title: slug === 'music-videos' ? 'Music Videos' : slug === 'events' ? 'Events' : slug,
  slug,
  parentId: null,
  children,
})

const categories: CategoryNode[] = [
  node('music-videos'),
  node('events', [
    { _id: 'corporate', title: 'Corporate', slug: 'corporate', parentId: 'events', children: [] },
    { _id: 'funerals', title: 'Funerals', slug: 'funerals', parentId: 'events', children: [] },
  ]),
]

describe('CategoryFilterBar', () => {
  it('offers every top-level category plus an All option', () => {
    render(
      <CategoryFilterBar
        categories={categories}
        activeCategory={null}
        activeType={null}
        onChange={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Music Videos' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Events' })).toBeInTheDocument()
  })

  it('reports the chosen category and clears any type', async () => {
    const onChange = vi.fn()
    render(
      <CategoryFilterBar
        categories={categories}
        activeCategory="events"
        activeType="funerals"
        onChange={onChange}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Music Videos' }))
    expect(onChange).toHaveBeenCalledWith({ category: 'music-videos', type: null })
  })

  it('clears both filters from the All option', async () => {
    const onChange = vi.fn()
    render(
      <CategoryFilterBar
        categories={categories}
        activeCategory="events"
        activeType={null}
        onChange={onChange}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'All' }))
    expect(onChange).toHaveBeenCalledWith({ category: null, type: null })
  })

  it('hides sub-categories until their parent is the active category', () => {
    const { rerender } = render(
      <CategoryFilterBar
        categories={categories}
        activeCategory={null}
        activeType={null}
        onChange={vi.fn()}
      />,
    )
    expect(screen.queryByRole('button', { name: 'Corporate' })).not.toBeInTheDocument()

    rerender(
      <CategoryFilterBar
        categories={categories}
        activeCategory="events"
        activeType={null}
        onChange={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: 'Corporate' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Funerals' })).toBeInTheDocument()
  })

  it('reports a chosen sub-category alongside its parent', async () => {
    const onChange = vi.fn()
    render(
      <CategoryFilterBar
        categories={categories}
        activeCategory="events"
        activeType={null}
        onChange={onChange}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Corporate' }))
    expect(onChange).toHaveBeenCalledWith({ category: 'events', type: 'corporate' })
  })

  it('marks the active pill for assistive tech', () => {
    render(
      <CategoryFilterBar
        categories={categories}
        activeCategory="music-videos"
        activeType={null}
        onChange={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: 'Music Videos' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })
})
```

- [ ] **Step 2: Install the interaction testing library**

```bash
npm install -D @testing-library/user-event
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run components/category-filter-bar.test.tsx`
Expected: FAIL — cannot resolve `./category-filter-bar`.

- [ ] **Step 4: Implement the filter bar**

Create `components/category-filter-bar.tsx`:

```tsx
'use client'

import type { CategoryNode } from '@/lib/categories'

export type FilterChange = { category: string | null; type: string | null }

function Pill({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`index-meta min-h-11 px-3 transition-colors ${
        active ? 'text-ink' : 'text-ink-muted hover:text-ink-soft'
      }`}
    >
      {label}
    </button>
  )
}

export function CategoryFilterBar({
  categories,
  activeCategory,
  activeType,
  onChange,
}: {
  categories: CategoryNode[]
  activeCategory: string | null
  activeType: string | null
  onChange: (next: FilterChange) => void
}) {
  const active = categories.find((category) => category.slug === activeCategory)
  const subCategories = active?.children ?? []

  return (
    <div className="border-b border-hairline">
      <div className="-mx-3 flex flex-wrap items-center">
        <Pill
          label="All"
          active={activeCategory === null}
          onClick={() => onChange({ category: null, type: null })}
        />
        {categories.map((category) => (
          <Pill
            key={category._id}
            label={category.title}
            active={activeCategory === category.slug}
            onClick={() => onChange({ category: category.slug, type: null })}
          />
        ))}
      </div>

      {subCategories.length > 0 && (
        <div className="-mx-3 flex flex-wrap items-center pb-1">
          {subCategories.map((sub) => (
            <Pill
              key={sub._id}
              label={sub.title}
              active={activeType === sub.slug}
              onClick={() =>
                onChange({
                  category: activeCategory,
                  type: activeType === sub.slug ? null : sub.slug,
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run components/category-filter-bar.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add components/category-filter-bar.tsx components/category-filter-bar.test.tsx package.json package-lock.json
git commit -m "Add category filter bar with nested sub-category pills"
```

---

### Task 6: Work browser

**Files:**
- Create: `lib/filter-query.ts`
- Create: `lib/filter-query.test.ts`
- Create: `components/work-browser.tsx`
- Create: `components/work-browser.test.tsx`

**Interfaces:**
- Consumes: `CategoryFilterBar` (Task 5), `ProjectCard` (Task 3), `filterProjects` (Task 4), `cadenceLayout` (Task 2), `CategoryNode` (Phase 1), `ProjectCardData`/`Cadence` (Task 1).
- Produces:
  - `buildFilterQuery(filter: { category: string | null; type: string | null }): string` — `''`, `'?category=ads'`, or `'?category=events&type=funerals'`
  - `<WorkBrowser projects={...} categories={...} cadence={...} initialCategory={...} initialType={...} pageSize={12} />` — the Client Component that owns filter state, URL sync, and progressive reveal.

- [ ] **Step 1: Write the failing test for the query builder**

Create `lib/filter-query.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildFilterQuery } from './filter-query'

describe('buildFilterQuery', () => {
  it('is empty when nothing is filtered, so the canonical URL stays clean', () => {
    expect(buildFilterQuery({ category: null, type: null })).toBe('')
  })

  it('carries the category alone', () => {
    expect(buildFilterQuery({ category: 'music-videos', type: null })).toBe(
      '?category=music-videos',
    )
  })

  it('carries category and type together', () => {
    expect(buildFilterQuery({ category: 'events', type: 'white-wedding' })).toBe(
      '?category=events&type=white-wedding',
    )
  })

  it('drops a type with no category rather than emitting a filter that cannot be restored', () => {
    expect(buildFilterQuery({ category: null, type: 'corporate' })).toBe('')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/filter-query.test.ts`
Expected: FAIL — cannot resolve `./filter-query`.

- [ ] **Step 3: Implement the query builder**

Create `lib/filter-query.ts`:

```ts
/**
 * Serialises the active filter into a shareable query string. An unfiltered
 * view has no query at all, so the discipline page keeps one canonical URL.
 */
export function buildFilterQuery({
  category,
  type,
}: {
  category: string | null
  type: string | null
}): string {
  if (!category) return ''
  const params = new URLSearchParams({ category })
  if (type) params.set('type', type)
  return `?${params.toString()}`
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/filter-query.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Write the failing test for the browser**

Create `components/work-browser.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { WorkBrowser } from './work-browser'
import type { CategoryNode } from '@/lib/categories'
import type { ProjectCardData } from '@/sanity/lib/content'

const replace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/cinematographer',
}))

const categories: CategoryNode[] = [
  { _id: 'ads', title: 'Ads', slug: 'ads', parentId: null, children: [] },
  {
    _id: 'events',
    title: 'Events',
    slug: 'events',
    parentId: null,
    children: [
      { _id: 'corporate', title: 'Corporate', slug: 'corporate', parentId: 'events', children: [] },
    ],
  },
]

const make = (
  slug: string,
  category: { slug: string; parentSlug: string | null },
): ProjectCardData => ({
  _id: slug,
  title: slug,
  slug,
  discipline: { title: 'Cinematographer', slug: 'cinematographer', cadence: 'filmstrip' },
  category: { title: category.slug, ...category },
})

const projects = [
  make('advert-one', { slug: 'ads', parentSlug: null }),
  make('gala-night', { slug: 'corporate', parentSlug: 'events' }),
]

describe('WorkBrowser', () => {
  beforeEach(() => replace.mockClear())

  it('shows every project when unfiltered', () => {
    render(
      <WorkBrowser
        projects={projects}
        categories={categories}
        cadence="filmstrip"
        initialCategory={null}
        initialType={null}
      />,
    )
    expect(screen.getByText('advert-one')).toBeInTheDocument()
    expect(screen.getByText('gala-night')).toBeInTheDocument()
  })

  it('filters instantly when a category is chosen', async () => {
    render(
      <WorkBrowser
        projects={projects}
        categories={categories}
        cadence="filmstrip"
        initialCategory={null}
        initialType={null}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Ads' }))
    expect(screen.getByText('advert-one')).toBeInTheDocument()
    expect(screen.queryByText('gala-night')).not.toBeInTheDocument()
  })

  it('syncs the chosen filter to the URL without scrolling the page', async () => {
    render(
      <WorkBrowser
        projects={projects}
        categories={categories}
        cadence="filmstrip"
        initialCategory={null}
        initialType={null}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Ads' }))
    expect(replace).toHaveBeenCalledWith('/cinematographer?category=ads', { scroll: false })
  })

  it('honours a filter that arrived in the URL', () => {
    render(
      <WorkBrowser
        projects={projects}
        categories={categories}
        cadence="filmstrip"
        initialCategory="events"
        initialType={null}
      />,
    )
    expect(screen.getByText('gala-night')).toBeInTheDocument()
    expect(screen.queryByText('advert-one')).not.toBeInTheDocument()
  })

  it('reveals more projects on request and then retires the button', async () => {
    const many = Array.from({ length: 5 }, (_, i) =>
      make(`project-${i}`, { slug: 'ads', parentSlug: null }),
    )
    render(
      <WorkBrowser
        projects={many}
        categories={categories}
        cadence="filmstrip"
        initialCategory={null}
        initialType={null}
        pageSize={2}
      />,
    )
    expect(screen.queryByText('project-4')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /load more/i }))
    expect(screen.getByText('project-3')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /load more/i }))
    expect(screen.getByText('project-4')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument()
  })

  it('tells the visitor when a filter matches nothing', async () => {
    render(
      <WorkBrowser
        projects={[projects[0]]}
        categories={categories}
        cadence="filmstrip"
        initialCategory={null}
        initialType={null}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Events' }))
    expect(screen.getByText(/no projects/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npx vitest run components/work-browser.test.tsx`
Expected: FAIL — cannot resolve `./work-browser`.

- [ ] **Step 7: Implement the work browser**

Create `components/work-browser.tsx`:

```tsx
'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

import { cadenceLayout } from '@/lib/cadence'
import type { CategoryNode } from '@/lib/categories'
import { buildFilterQuery } from '@/lib/filter-query'
import { filterProjects } from '@/lib/filter-projects'
import type { Cadence, ProjectCardData } from '@/sanity/lib/content'
import { CategoryFilterBar, type FilterChange } from './category-filter-bar'
import { ProjectCard } from './project-card'

export function WorkBrowser({
  projects,
  categories,
  cadence,
  initialCategory,
  initialType,
  pageSize = 12,
}: {
  projects: ProjectCardData[]
  categories: CategoryNode[]
  cadence: Cadence
  initialCategory: string | null
  initialType: string | null
  pageSize?: number
}) {
  const router = useRouter()
  const pathname = usePathname()

  const [filter, setFilter] = useState<FilterChange>({
    category: initialCategory,
    type: initialType,
  })
  const [visible, setVisible] = useState(pageSize)

  const layout = cadenceLayout(cadence)
  const filtered = useMemo(() => filterProjects(projects, filter), [projects, filter])
  const shown = filtered.slice(0, visible)

  function apply(next: FilterChange) {
    setFilter(next)
    setVisible(pageSize)
    router.replace(`${pathname}${buildFilterQuery(next)}`, { scroll: false })
  }

  return (
    <div>
      <CategoryFilterBar
        categories={categories}
        activeCategory={filter.category}
        activeType={filter.type}
        onChange={apply}
      />

      {filtered.length === 0 ? (
        <p className="index-meta py-24 text-center">No projects in this category yet.</p>
      ) : (
        <div className={`mt-12 ${layout.grid}`}>
          {shown.map((project, index) => (
            <ProjectCard
              key={project._id}
              project={project}
              index={index}
              cadence={cadence}
            />
          ))}
        </div>
      )}

      {visible < filtered.length && (
        <div className="mt-20 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((count) => count + pageSize)}
            className="index-meta min-h-11 border border-hairline px-8 transition-colors hover:text-ink"
          >
            Load more ({filtered.length - visible})
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npx vitest run components/work-browser.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 9: Commit**

```bash
git add lib/filter-query.ts lib/filter-query.test.ts components/work-browser.tsx components/work-browser.test.tsx
git commit -m "Add work browser with URL-synced filtering and load more"
```

---

### Task 7: Discipline page route

**Files:**
- Create: `app/[discipline]/page.tsx`

**Interfaces:**
- Consumes: `getDisciplines`, `getDisciplineBySlug`, `getCategoriesForDiscipline`, `getProjectsForDiscipline` (Tasks 1 and Phase 1), `buildCategoryTree` (Phase 1), `WorkBrowser` (Task 6).
- Produces: the `/[discipline]` route, `generateStaticParams`, and `generateMetadata`.

- [ ] **Step 1: Re-read the Cache Components rules before writing this file**

Read `node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md`, the sections "Await `params` inside `<Suspense>`" and the `searchParams` example that follows it. The three rules this task must respect:
1. `params` and `searchParams` are Promises; type them with `PageProps<'/[discipline]'>`.
2. Do not `await` either at the top of the page component — pass the promise to a `<Suspense>`-wrapped child and await it there.
3. Do not add a `dynamicParams` route segment config; it hard-errors under `cacheComponents: true`. Unknown params render on request, and `notFound()` handles ones that resolve to nothing.

- [ ] **Step 2: Write the page**

Create `app/[discipline]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { WorkBrowser } from '@/components/work-browser'
import { buildCategoryTree } from '@/lib/categories'
import {
  getCategoriesForDiscipline,
  getDisciplineBySlug,
  getDisciplines,
  getProjectsForDiscipline,
} from '@/sanity/lib/content'

export async function generateStaticParams() {
  const disciplines = await getDisciplines()
  return disciplines.map((discipline) => ({ discipline: discipline.slug }))
}

export async function generateMetadata({ params }: PageProps<'/[discipline]'>) {
  const { discipline: slug } = await params
  const discipline = await getDisciplineBySlug(slug)
  if (!discipline) return {}
  return {
    title: `${discipline.title} — Amegah`,
    description: discipline.description,
  }
}

const first = (value: string | string[] | undefined): string | null =>
  (Array.isArray(value) ? value[0] : value) ?? null

export default function DisciplinePage({ params, searchParams }: PageProps<'/[discipline]'>) {
  return (
    <Suspense fallback={<DisciplineFallback />}>
      <DisciplineView params={params} searchParams={searchParams} />
    </Suspense>
  )
}

function DisciplineFallback() {
  return (
    <section className="px-6 py-24">
      <div className="h-12 w-64 animate-pulse bg-white/5" />
    </section>
  )
}

async function DisciplineView({
  params,
  searchParams,
}: Pick<PageProps<'/[discipline]'>, 'params' | 'searchParams'>) {
  const { discipline: slug } = await params
  const discipline = await getDisciplineBySlug(slug)

  if (!discipline) {
    notFound()
  }

  const [flatCategories, projects, query] = await Promise.all([
    getCategoriesForDiscipline(slug),
    getProjectsForDiscipline(slug),
    searchParams,
  ])

  const categories = buildCategoryTree(flatCategories)

  return (
    <section className="px-6 py-20 md:py-28">
      <header className="mb-12">
        <h1
          className="font-display text-ink"
          style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', lineHeight: 1.05 }}
        >
          {discipline.title}
        </h1>
        {discipline.description && (
          <p className="mt-4 max-w-[var(--measure)] text-ink-soft">{discipline.description}</p>
        )}
        <p className="index-meta mt-6">
          {projects.length} {projects.length === 1 ? 'project' : 'projects'}
        </p>
      </header>

      <WorkBrowser
        projects={projects}
        categories={categories}
        cadence={discipline.cadence}
        initialCategory={first(query.category)}
        initialType={first(query.type)}
      />
    </section>
  )
}
```

- [ ] **Step 3: Verify the build and the full suite**

Run: `npm test && npm run build`
Expected: all tests PASS; the build succeeds. In the build's route table, `/[discipline]` should appear — confirm the build does **not** error with a Cache Components message about `params`/`searchParams` being accessed outside a Suspense boundary. If it does, the access moved to the wrong component: the page function must stay synchronous and pass both promises down.

- [ ] **Step 4: Verify live against the seeded content**

Run `npm run dev`, then check each of these and note what you actually see:
- `http://localhost:3000/cinematographer` — heading "Cinematographer", the project count, and the filter bar showing All / Music Videos / Ads / Documentaries / Short Films / Events. With no projects seeded yet, the grid area shows the "No projects in this category yet." message — that is correct, not a failure.
- Click **Events** — a second pill row appears with Corporate, Traditional Wedding, White Wedding, Parties, Funerals, and the URL becomes `/cinematographer?category=events` without the page scrolling or reloading.
- Click **Corporate** — the URL becomes `/cinematographer?category=events&type=corporate`.
- Load `http://localhost:3000/cinematographer?category=events` directly in a new tab — the Events pill is already active on first paint, and the sub-row is already showing.
- `http://localhost:3000/photographer` — heading "Photographer", pills All / Portraits / Lifestyle / Editorial.
- `http://localhost:3000/not-a-discipline` — renders the 404 page, not a crash.
- `http://localhost:3000/studio` — still loads (the dynamic `[discipline]` segment must not shadow it).

Stop the dev server when done.

- [ ] **Step 5: Prove the phase's real requirement**

This is the check that matters most. In the Studio at `http://localhost:3000/studio`:
1. Create a new Discipline — title `Colourist`, slug `colourist`, cadence `editorial` — and publish it.
2. Create a Category under it — title `Grading`, slug `grading` — and publish.
3. Visit `http://localhost:3000/colourist`.

The page must render with the heading "Colourist" and a Grading pill, **with no code change and no redeploy**. Note in your report how long it took to appear (the webhook is not wired up locally, so a dev-server restart may be needed — say so if it was).

Then delete both documents in the Studio and confirm `/colourist` returns to a 404.

- [ ] **Step 6: Commit**

```bash
git add app/
git commit -m "Add discipline pages with filtering and cadence-driven grids"
```

---

## Phase 2 done when

- `npm test` passes and `npm run build` succeeds
- Every seeded discipline has a working page at its own CMS-defined slug
- Category pills filter instantly, sub-category pills appear for nested categories, and the URL reflects the active filter
- A filtered URL opened directly renders already filtered, with no unfiltered flash
- A discipline created in the Studio gets a working page with no code change — the requirement Phase 1 existed to make possible and this phase proves
- An unknown slug 404s, and `/studio` still works

## What Phase 2 deliberately leaves out

Project detail pages and Mux video (Phase 3) — cards link to `/work/[slug]`, which 404s until then. Homepage hero variants, featured layout, and the discipline triptych (Phase 4). About, Clients & Partners, Contact (Phase 5). Motion, `mobileCoverImage` art direction, OG images, the performance-budget pass, and the accessibility audit (Phase 6).
