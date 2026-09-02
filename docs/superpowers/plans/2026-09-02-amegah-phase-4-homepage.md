# Amegah Portfolio — Phase 4: Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the homepage — a hero the client can switch between three treatments, a featured-work selection, the three-practices triptych, a client/partner logo strip, and a contact close.

**Architecture:** Everything on the page is CMS data. The hero's treatment is a field on Site Settings, so the client picks between a showreel, a still, or pure typography without a developer. Every section renders nothing rather than breaking when its data is absent, because the site launches empty and fills up over time.

**Tech Stack:** Next.js 16 (App Router, Cache Components, PPR), React 19.2, TypeScript, Tailwind CSS v4, Sanity v5, Mux, Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-01-amegah-portfolio-design.md` (§6.1 homepage, §3.2 site settings)
**Builds on:** Phases 1–3, all merged to `main`.

## Global Constraints

- **Next.js 16 conventions only**, as established across Phases 1–3.
- **Never add `generateStaticParams` over CMS content.** Phase 3 shipped a build break because a CMS-driven route's `generateStaticParams` returned `[]` on an empty dataset, which Cache Components treats as a hard error — meaning the client could break their own build by archiving their work. The homepage is a static route with no params, so the trap does not apply directly, but the lesson does: **nothing on this page may assume content exists.**
- **Empty-dataset resilience is a first-class requirement of this phase.** `npm run build` and a visual check must both pass with zero projects, zero clients, zero partners, and an unpopulated Site Settings document. Every section returns `null` when it has nothing to show; the page never renders a bare heading over an empty void, and never throws.
- **Disciplines and categories are never hardcoded** outside `scripts/seed-data.ts`.
- **Design tokens only** — `bg-ground`, `text-ink`, `text-ink-soft`, `text-ink-muted`, `border-hairline`, `bg-hairline`, `font-display`, `.index-meta`. **No ad-hoc colours.** This has been violated twice; before every commit run `grep -rn "white/\|black/\|bg-\[#\|text-\[#" app components` and confirm no hits. (`accentColor="#ffffff"` on Mux Player is a legitimate API prop and won't match.)
- **Colour palette (client brief §7):** background `#0A0A0A`, main text `#FFFFFF`, off-white subtext `#D8D8D3`, grey accents `#8A8A85`. No accent colour.
- **Touch targets ≥44px**, no hover-only affordances — every hover behaviour needs a tap equivalent.
- **Never commit secrets.** Never read, print, or enter `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET`.

## What is and isn't verifiable this phase

Mux is provisioned, but the **one-time credential entry in Studio is still outstanding** (a human-only step — pasting API tokens into a form). Verified before writing this plan: zero `mux.apiKey` documents exist. So the `reel` hero variant can be built and unit-tested but **not exercised with real video**, exactly as in Phase 3. Plan around that: the other two hero variants and every other section are fully verifiable, and the reel variant's correctness rests on the same Mux wiring a reviewer already validated against the plugin's real schema in Phase 3.

## Decisions this plan locks in

1. **`heroVariant` defaults to `type`.** A brand-new site has no showreel and no chosen stills, so the typographic hero is the only one that looks deliberate with nothing in the CMS. The client switches to `reel` or `still` once they have the assets.
2. **The hero reel autoplays, muted, looping — and this does not contradict Phase 3.** The brief allows autoplay "where appropriate" and for "background/showreel use", and forbids it only for full videos on mobile data. A silent background loop is precisely the sanctioned case; a project's film is not. Both rules now live in the codebase, so the distinction must be obvious in the code.
3. **All three hero variants render the name and role identically.** Success criterion #2 is that a visitor immediately understands who this is; that must not depend on which treatment the client picked.
4. **Featured work uses an asymmetric editorial rhythm**, not a uniform grid — alternating full-bleed and half-width blocks. This is the main thing separating "premium" from "template" (criterion #7), and it is deliberately different from the discipline pages' cadence grids.
5. **Clients and partners share one strip.** They are the same UI pattern and the same credibility signal; the spec lists them separately as content, not as two separate homepage sections.
6. **`previewLoop` stays unused.** It exists on `project` since Phase 1 for hover previews on cards. Wiring it up is a Phase 6 polish concern, not a homepage requirement, and hover-only affordances need tap equivalents anyway.

---

### Task 1: Extend Site Settings for the homepage

**Files:**
- Modify: `sanity/schemaTypes/siteSettings.ts`
- Create: `sanity/schemaTypes/siteSettings.test.ts`

**Interfaces:**
- Consumes: the existing `siteSettings` singleton (Phase 1).
- Produces: new fields `role`, `heroVariant`, `heroVideo`, `heroImages`, `seoTitle`, `seoDescription`, `ogImage`.

- [ ] **Step 1: Write the failing test**

Create `sanity/schemaTypes/siteSettings.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { siteSettings } from './siteSettings'

type Field = { name: string; type: string; options?: { list?: unknown[] }; initialValue?: unknown }
const fields = () => siteSettings.fields as unknown as Field[]
const field = (name: string) => fields().find((f) => f.name === name)

describe('siteSettings schema', () => {
  it('carries the role line shown under the name', () => {
    expect(field('role')?.type).toBe('string')
  })

  it('lets the client choose the hero treatment themselves', () => {
    const heroVariant = field('heroVariant')
    expect(heroVariant?.type).toBe('string')
    expect(heroVariant?.options?.list).toEqual(['reel', 'still', 'type'])
  })

  it('defaults the hero to type, the only treatment that works with no assets', () => {
    expect(field('heroVariant')?.initialValue).toBe('type')
  })

  it('holds a showreel for the reel treatment', () => {
    expect(field('heroVideo')?.type).toBe('mux.video')
  })

  it('holds stills for the still treatment', () => {
    expect(field('heroImages')?.type).toBe('array')
  })

  it('carries search and share metadata', () => {
    expect(field('seoTitle')?.type).toBe('string')
    expect(field('seoDescription')?.type).toBe('text')
    expect(field('ogImage')?.type).toBe('image')
  })

  it('keeps the contact details the footer already uses', () => {
    expect(field('email')?.type).toBe('string')
    expect(field('phone')?.type).toBe('string')
    expect(field('instagramUrl')?.type).toBe('url')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run sanity/schemaTypes/siteSettings.test.ts`
Expected: FAIL — `role`, `heroVariant`, `heroVideo`, `heroImages`, `seoTitle`, `seoDescription`, `ogImage` are all undefined.

- [ ] **Step 3: Add the fields**

In `sanity/schemaTypes/siteSettings.ts`, add these fields. Put `role` directly after `name`, the hero fields after `headshot`, and the SEO fields last. Leave every existing field untouched.

```ts
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      description: 'The line under the name, e.g. “Director · Cinematographer · Photographer”.',
    }),
```

```ts
    defineField({
      name: 'heroVariant',
      title: 'Homepage Hero',
      type: 'string',
      description:
        'How the homepage opens. Reel: a silent looping showreel. Still: full-bleed photographs. Type: the name at full size, no imagery.',
      options: {
        list: ['reel', 'still', 'type'],
        layout: 'radio',
      },
      initialValue: 'type',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'heroVideo',
      title: 'Showreel',
      type: 'mux.video',
      description: 'Used when the hero is set to Reel. Plays silently on a loop.',
      hidden: ({ parent }) => parent?.heroVariant !== 'reel',
    }),
    defineField({
      name: 'heroImages',
      title: 'Hero Stills',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
      description: 'Used when the hero is set to Still. The first image is shown.',
      hidden: ({ parent }) => parent?.heroVariant !== 'still',
    }),
```

```ts
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
      description: 'Overrides the browser tab and search result title.',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'ogImage',
      title: 'Social Share Image',
      type: 'image',
      description: 'Shown when the site is linked on Instagram, WhatsApp or elsewhere.',
    }),
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run sanity/schemaTypes/siteSettings.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Verify the whole suite and types**

Run: `npm test && npx tsc --noEmit`
Expected: all PASS, no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add sanity/schemaTypes/
git commit -m "Add hero, role and SEO fields to site settings"
```

---

### Task 2: Homepage queries and cached getters

**Files:**
- Modify: `sanity/lib/queries.ts`
- Modify: `sanity/lib/queries.test.ts`
- Modify: `sanity/lib/content.ts`

**Interfaces:**
- Consumes: `IMAGE_FIELDS`, `PROJECT_CARD_PROJECTION`, `TAGS` (Phases 1–3).
- Produces:
  - Extended `SITE_SETTINGS_QUERY`, plus `FEATURED_PROJECTS_QUERY`, `CLIENTS_QUERY`, `PARTNERS_QUERY`
  - `type HeroVariant = 'reel' | 'still' | 'type'`
  - `type LogoRef = { _id: string; name: string; logo?: SanityImage; url?: string }`
  - Extended `SiteSettings` with `role`, `heroVariant`, `heroVideo`, `heroImages`, `seoTitle`, `seoDescription`, `ogImage`
  - `getFeaturedProjects(): Promise<ProjectCardData[]>`, `getClients(): Promise<LogoRef[]>`, `getPartners(): Promise<LogoRef[]>`

- [ ] **Step 1: Write the failing tests**

Append to `sanity/lib/queries.test.ts`, adding the new names to the existing import:

```ts
describe('SITE_SETTINGS_QUERY', () => {
  it('returns the hero treatment and its assets', () => {
    expect(SITE_SETTINGS_QUERY).toContain('heroVariant')
    expect(SITE_SETTINGS_QUERY).toContain('heroVideo')
    expect(SITE_SETTINGS_QUERY).toContain('heroImages')
  })

  it('follows the hero video reference to its playback id', () => {
    expect(SITE_SETTINGS_QUERY).toContain('heroVideo.asset->')
    expect(SITE_SETTINGS_QUERY).toContain('playbackId')
  })

  it('returns the role line and share metadata', () => {
    expect(SITE_SETTINGS_QUERY).toContain('role')
    expect(SITE_SETTINGS_QUERY).toContain('seoTitle')
    expect(SITE_SETTINGS_QUERY).toContain('ogImage')
  })
})

describe('FEATURED_PROJECTS_QUERY', () => {
  it('returns only featured, unarchived projects in the editor’s order', () => {
    expect(FEATURED_PROJECTS_QUERY).toContain('featured == true')
    expect(FEATURED_PROJECTS_QUERY).toContain('!archived')
    expect(FEATURED_PROJECTS_QUERY).toContain('order(orderRank)')
  })
})

describe('CLIENTS_QUERY and PARTNERS_QUERY', () => {
  it('each list their own document type in the editor’s order', () => {
    expect(CLIENTS_QUERY).toContain('_type == "client"')
    expect(CLIENTS_QUERY).toContain('order(orderRank)')
    expect(PARTNERS_QUERY).toContain('_type == "partner"')
    expect(PARTNERS_QUERY).toContain('order(orderRank)')
  })

  it('return the logo and the outbound link', () => {
    expect(CLIENTS_QUERY).toContain('logo')
    expect(CLIENTS_QUERY).toContain('url')
    expect(PARTNERS_QUERY).toContain('logo')
    expect(PARTNERS_QUERY).toContain('url')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run sanity/lib/queries.test.ts`
Expected: FAIL — the new queries are not exported and `SITE_SETTINGS_QUERY` lacks the new fields.

- [ ] **Step 3: Extend and add the queries**

Replace `SITE_SETTINGS_QUERY` in `sanity/lib/queries.ts` with:

```ts
export const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0] {
  name,
  role,
  headshot,
  bio,
  phone,
  email,
  instagramUrl,
  heroVariant,
  "heroVideo": heroVideo.asset->{playbackId, assetId},
  "heroImages": heroImages[]{
    ${IMAGE_FIELDS}
  },
  seoTitle,
  seoDescription,
  ogImage
}`
```

Also extend `DISCIPLINES_QUERY`'s cover image so the triptych can use its blur placeholder and focal point — it currently projects `coverImage` raw, which would leave `lqip` and `hotspot` undefined at the point of use. Replace its `coverImage,` line with:

```ts
  "coverImage": coverImage{
    ${IMAGE_FIELDS}
  },
```

Then append:

```ts
export const FEATURED_PROJECTS_QUERY = `*[_type == "project" && !archived && featured == true] | order(orderRank) ${PROJECT_CARD_PROJECTION}`

export const CLIENTS_QUERY = `*[_type == "client"] | order(orderRank) {
  _id,
  name,
  logo,
  url
}`

export const PARTNERS_QUERY = `*[_type == "partner"] | order(orderRank) {
  _id,
  name,
  logo,
  url
}`
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run sanity/lib/queries.test.ts`
Expected: PASS.

- [ ] **Step 5: Extend the types and add the getters**

In `sanity/lib/content.ts`, add the new query names to the existing import from `./queries`, then extend `SiteSettings` and append the getters:

```ts
export type HeroVariant = 'reel' | 'still' | 'type'

export type LogoRef = {
  _id: string
  name: string
  logo?: SanityImage
  url?: string
}
```

Add these fields to the existing `SiteSettings` type (keep everything already on it):

```ts
  role?: string
  heroVariant?: HeroVariant
  heroVideo?: MuxVideo | null
  heroImages?: SanityImage[]
  seoTitle?: string
  seoDescription?: string
  ogImage?: SanityImage
```

Then append:

```ts
export async function getFeaturedProjects(): Promise<ProjectCardData[]> {
  'use cache'
  // The card projection dereferences discipline and category.
  cacheTag(TAGS.project, TAGS.discipline, TAGS.category)
  cacheLife('max')
  return client.fetch<ProjectCardData[]>(FEATURED_PROJECTS_QUERY)
}

export async function getClients(): Promise<LogoRef[]> {
  'use cache'
  cacheTag(TAGS.client)
  cacheLife('max')
  return client.fetch<LogoRef[]>(CLIENTS_QUERY)
}

export async function getPartners(): Promise<LogoRef[]> {
  'use cache'
  cacheTag(TAGS.partner)
  cacheLife('max')
  return client.fetch<LogoRef[]>(PARTNERS_QUERY)
}
```

Also change the existing `Discipline` type's `coverImage?: unknown` to `coverImage?: SanityImage`, now that the query returns a real image shape. This removes the need for casts at every point of use.

`getSiteSettings` already tags `TAGS.siteSettings`; now that its query dereferences the Mux hero asset, add `TAGS.muxVideoAsset` to its `cacheTag(...)` call and update its comment, matching what `getProjectBySlug` does.

- [ ] **Step 6: Verify**

Run: `npm test && npx tsc --noEmit`
Expected: all PASS, no errors.

- [ ] **Step 7: Commit**

```bash
git add sanity/lib/
git commit -m "Add homepage queries for hero, featured work, clients and partners"
```

---

### Task 3: Hero

**Files:**
- Create: `components/home-hero.tsx`
- Create: `components/home-hero.test.tsx`

**Interfaces:**
- Consumes: `SiteSettings`, `HeroVariant` (Task 2), `ProjectVideo`-adjacent Mux usage, `urlFor`, `hotspotPosition`.
- Produces: `<HomeHero settings={SiteSettings | null} />`.

The three treatments differ only in what sits behind the name. **The name and role render identically in all three** (decision 3), and an unset or unknown variant falls back to `type`.

Note the reel variant autoplays muted and looping — the sanctioned "background/showreel" case (decision 2), the opposite of `ProjectVideo`'s deliberate no-autoplay. Make that contrast explicit in a comment so a future reader doesn't "fix" one to match the other.

- [ ] **Step 1: Write the failing test**

Create `components/home-hero.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { HomeHero } from './home-hero'
import type { SiteSettings } from '@/sanity/lib/content'

vi.mock('@mux/mux-player-react', () => ({
  default: (props: Record<string, unknown>) => (
    <div
      data-testid="hero-player"
      data-playback-id={props.playbackId as string}
      data-autoplay={String(props.autoPlay ?? false)}
      data-muted={String(props.muted ?? false)}
      data-loop={String(props.loop ?? false)}
    />
  ),
}))

const base: SiteSettings = { name: 'Amegah', role: 'Director · Cinematographer' }

describe('HomeHero', () => {
  it('always shows the name and role, whichever treatment is chosen', () => {
    for (const heroVariant of ['reel', 'still', 'type'] as const) {
      const { unmount } = render(<HomeHero settings={{ ...base, heroVariant }} />)
      expect(screen.getByText('Amegah')).toBeInTheDocument()
      expect(screen.getByText('Director · Cinematographer')).toBeInTheDocument()
      unmount()
    }
  })

  it('plays the showreel silently and on a loop for the reel treatment', () => {
    render(
      <HomeHero
        settings={{ ...base, heroVariant: 'reel', heroVideo: { playbackId: 'pb1' } }}
      />,
    )
    const player = screen.getByTestId('hero-player')
    expect(player).toHaveAttribute('data-playback-id', 'pb1')
    expect(player).toHaveAttribute('data-autoplay', 'true')
    expect(player).toHaveAttribute('data-muted', 'true')
    expect(player).toHaveAttribute('data-loop', 'true')
  })

  it('shows the first still for the still treatment', () => {
    render(
      <HomeHero
        settings={{
          ...base,
          heroVariant: 'still',
          heroImages: [{ asset: { _ref: 'image-a-1600x900-jpg' } }],
        }}
      />,
    )
    expect(screen.getByRole('img', { name: 'Amegah' })).toBeInTheDocument()
  })

  it('falls back to type when the chosen treatment has no asset yet', () => {
    render(<HomeHero settings={{ ...base, heroVariant: 'reel' }} />)
    expect(screen.queryByTestId('hero-player')).not.toBeInTheDocument()
    expect(screen.getByText('Amegah')).toBeInTheDocument()
  })

  it('renders nothing when there are no settings at all', () => {
    const { container } = render(<HomeHero settings={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/home-hero.test.tsx`
Expected: FAIL — cannot resolve `./home-hero`.

- [ ] **Step 3: Implement the hero**

Create `components/home-hero.tsx`:

```tsx
'use client'

import MuxPlayer from '@mux/mux-player-react'
import Image from 'next/image'

import { hotspotPosition } from '@/lib/card-meta'
import type { SiteSettings } from '@/sanity/lib/content'
import { urlFor } from '@/sanity/lib/image'

/**
 * The homepage opening. The client chooses the treatment in Site Settings.
 *
 * The showreel here DOES autoplay, muted and looping — that is the
 * "background/showreel" case the brief sanctions. It is the opposite of
 * ProjectVideo, which must never autoplay because that is the full film.
 * Keep the two straight.
 */
export function HomeHero({ settings }: { settings: SiteSettings | null }) {
  if (!settings) return null

  const variant = settings.heroVariant ?? 'type'
  const playbackId = settings.heroVideo?.playbackId
  const still = settings.heroImages?.[0]

  const showReel = variant === 'reel' && playbackId
  const showStill = variant === 'still' && still?.asset

  return (
    <section className="relative flex min-h-[70vh] flex-col justify-end overflow-hidden px-6 py-20 md:min-h-[85vh]">
      {showReel && (
        <div className="absolute inset-0 bg-hairline">
          <MuxPlayer
            playbackId={playbackId}
            streamType="on-demand"
            autoPlay
            muted
            loop
            playsInline
            accentColor="#ffffff"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
          />
        </div>
      )}

      {showStill && (
        <div className="absolute inset-0 bg-hairline">
          <Image
            src={urlFor(still).width(2400).auto('format').url()}
            alt={settings.name}
            fill
            priority
            sizes="100vw"
            placeholder={still.lqip ? 'blur' : 'empty'}
            blurDataURL={still.lqip}
            style={{ objectPosition: hotspotPosition(still) }}
            className="object-cover"
          />
        </div>
      )}

      <div className="relative">
        <h1
          className="font-display text-ink"
          style={{ fontSize: 'clamp(2.5rem, 10vw, 8rem)', lineHeight: 1.02 }}
        >
          {settings.name}
        </h1>
        {settings.role && <p className="index-meta mt-4">{settings.role}</p>}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run components/home-hero.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add components/home-hero.tsx components/home-hero.test.tsx
git commit -m "Add homepage hero with three client-switchable treatments"
```

---

### Task 4: Featured work

**Files:**
- Create: `lib/featured-layout.ts`
- Create: `lib/featured-layout.test.ts`
- Create: `components/featured-work.tsx`
- Create: `components/featured-work.test.tsx`

**Interfaces:**
- Consumes: `ProjectCardData` (Phase 2), `ProjectCard` (Phase 2), `indexLabel`/`hotspotPosition`.
- Produces:
  - `featuredSpan(index: number): 'full' | 'half'` — the asymmetric rhythm
  - `<FeaturedWork projects={ProjectCardData[]} />`

- [ ] **Step 1: Write the failing test for the rhythm**

Create `lib/featured-layout.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { featuredSpan } from './featured-layout'

describe('featuredSpan', () => {
  it('opens full-bleed so the first piece of work lands hardest', () => {
    expect(featuredSpan(0)).toBe('full')
  })

  it('follows with a pair of halves', () => {
    expect(featuredSpan(1)).toBe('half')
    expect(featuredSpan(2)).toBe('half')
  })

  it('repeats the rhythm rather than settling into a uniform grid', () => {
    expect(featuredSpan(3)).toBe('full')
    expect(featuredSpan(4)).toBe('half')
    expect(featuredSpan(5)).toBe('half')
    expect(featuredSpan(6)).toBe('full')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/featured-layout.test.ts`
Expected: FAIL — cannot resolve `./featured-layout`.

- [ ] **Step 3: Implement the rhythm**

Create `lib/featured-layout.ts`:

```ts
/**
 * The featured selection runs in a repeating full / half / half rhythm.
 *
 * A uniform grid is what makes portfolio templates look like templates
 * (spec criterion 7). Opening full-bleed and then breaking into pairs gives
 * the page a cadence without needing the client to lay anything out.
 */
export function featuredSpan(index: number): 'full' | 'half' {
  return index % 3 === 0 ? 'full' : 'half'
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/featured-layout.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Write the failing test for the section**

Create `components/featured-work.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FeaturedWork } from './featured-work'
import type { ProjectCardData } from '@/sanity/lib/content'

const make = (slug: string): ProjectCardData => ({
  _id: slug,
  title: slug,
  slug,
  coverImage: { asset: { _ref: 'image-a-1600x900-jpg' } },
  discipline: { title: 'Director', slug: 'director', cadence: 'cinematic' },
  category: { title: 'Music Videos', slug: 'music-videos', parentSlug: null },
})

describe('FeaturedWork', () => {
  it('renders every featured project', () => {
    render(<FeaturedWork projects={[make('one'), make('two')]} />)
    expect(screen.getByText('one')).toBeInTheDocument()
    expect(screen.getByText('two')).toBeInTheDocument()
  })

  it('links each project to its page', () => {
    render(<FeaturedWork projects={[make('one')]} />)
    expect(screen.getByRole('link', { name: /one/ })).toHaveAttribute('href', '/work/one')
  })

  it('renders nothing when the client has featured nothing yet', () => {
    const { container } = render(<FeaturedWork projects={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npx vitest run components/featured-work.test.tsx`
Expected: FAIL — cannot resolve `./featured-work`.

- [ ] **Step 7: Implement the section**

Create `components/featured-work.tsx`:

```tsx
import { featuredSpan } from '@/lib/featured-layout'
import type { ProjectCardData } from '@/sanity/lib/content'
import { ProjectCard } from './project-card'

export function FeaturedWork({ projects }: { projects: ProjectCardData[] }) {
  if (projects.length === 0) return null

  return (
    <section className="px-6 py-24 md:py-32">
      <h2 className="index-meta mb-12">Selected work</h2>
      <div className="grid grid-cols-1 gap-x-6 gap-y-20 md:grid-cols-2">
        {projects.map((project, index) => (
          <div
            key={project._id}
            className={featuredSpan(index) === 'full' ? 'md:col-span-2' : undefined}
          >
            <ProjectCard
              project={project}
              index={index}
              cadence={featuredSpan(index) === 'full' ? 'cinematic' : 'editorial'}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npx vitest run components/featured-work.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 9: Commit**

```bash
git add lib/featured-layout.ts lib/featured-layout.test.ts components/featured-work.tsx components/featured-work.test.tsx
git commit -m "Add featured work section with asymmetric rhythm"
```

---

### Task 5: The three practices

**Files:**
- Create: `components/practices.tsx`
- Create: `components/practices.test.tsx`

**Interfaces:**
- Consumes: `Discipline` (Phase 1), `urlFor`, `hotspotPosition`.
- Produces: `<Practices disciplines={Discipline[]} />` — the triptych making criterion #3 explicit.

- [ ] **Step 1: Write the failing test**

Create `components/practices.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Practices } from './practices'
import type { Discipline } from '@/sanity/lib/content'

const disciplines: Discipline[] = [
  { _id: 'd1', title: 'Director', slug: 'director', cadence: 'cinematic', description: 'Music videos and ads' },
  { _id: 'd2', title: 'Photographer', slug: 'photographer', cadence: 'editorial' },
]

describe('Practices', () => {
  it('links each practice to its own page', () => {
    render(<Practices disciplines={disciplines} />)
    expect(screen.getByRole('link', { name: /Director/ })).toHaveAttribute('href', '/director')
    expect(screen.getByRole('link', { name: /Photographer/ })).toHaveAttribute('href', '/photographer')
  })

  it('shows the description where the client wrote one', () => {
    render(<Practices disciplines={disciplines} />)
    expect(screen.getByText('Music videos and ads')).toBeInTheDocument()
  })

  it('renders nothing when there are no disciplines', () => {
    const { container } = render(<Practices disciplines={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/practices.test.tsx`
Expected: FAIL — cannot resolve `./practices`.

- [ ] **Step 3: Implement it**

Create `components/practices.tsx`:

```tsx
import Image from 'next/image'
import Link from 'next/link'

import { hotspotPosition } from '@/lib/card-meta'
import type { Discipline } from '@/sanity/lib/content'
import { urlFor } from '@/sanity/lib/image'

export function Practices({ disciplines }: { disciplines: Discipline[] }) {
  if (disciplines.length === 0) return null

  return (
    <section className="border-t border-hairline px-6 py-24 md:py-32">
      <h2 className="index-meta mb-12">The work</h2>
      <div className="grid grid-cols-1 gap-x-6 gap-y-12 md:grid-cols-3">
        {disciplines.map((discipline) => {
          const cover = discipline.coverImage

          return (
            <Link key={discipline._id} href={`/${discipline.slug}`} className="group block">
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-hairline">
                {cover?.asset && (
                  <Image
                    src={urlFor(cover).width(1200).auto('format').url()}
                    alt={discipline.title}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    placeholder={cover.lqip ? 'blur' : 'empty'}
                    blurDataURL={cover.lqip}
                    style={{ objectPosition: hotspotPosition(cover) }}
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                )}
              </div>
              <h3 className="font-display mt-4 text-2xl text-ink">{discipline.title}</h3>
              {discipline.description && (
                <p className="mt-2 max-w-[var(--measure)] text-ink-soft">{discipline.description}</p>
              )}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run components/practices.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add components/practices.tsx components/practices.test.tsx
git commit -m "Add the three practices triptych"
```

---

### Task 6: Clients and partners strip

**Files:**
- Create: `components/logo-strip.tsx`
- Create: `components/logo-strip.test.tsx`

**Interfaces:**
- Consumes: `LogoRef` (Task 2), `urlFor`.
- Produces: `<LogoStrip clients={LogoRef[]} partners={LogoRef[]} />`.

A logo with no image still renders its name as text — a client who hasn't uploaded a logo yet should still be credited.

- [ ] **Step 1: Write the failing test**

Create `components/logo-strip.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { LogoStrip } from './logo-strip'
import type { LogoRef } from '@/sanity/lib/content'

const withLogo: LogoRef = {
  _id: 'c1',
  name: 'Studio One',
  logo: { asset: { _ref: 'image-a-400x200-png' } },
  url: 'https://example.com',
}
const withoutLogo: LogoRef = { _id: 'c2', name: 'Studio Two' }

describe('LogoStrip', () => {
  it('shows both groups when both have entries', () => {
    render(<LogoStrip clients={[withLogo]} partners={[withoutLogo]} />)
    expect(screen.getByText('Clients')).toBeInTheDocument()
    expect(screen.getByText('Partners')).toBeInTheDocument()
  })

  it('links a logo out when the client gave a website', () => {
    render(<LogoStrip clients={[withLogo]} partners={[]} />)
    expect(screen.getByRole('link', { name: 'Studio One' })).toHaveAttribute(
      'href',
      'https://example.com',
    )
  })

  it('still credits a name that has no logo uploaded', () => {
    render(<LogoStrip clients={[withoutLogo]} partners={[]} />)
    expect(screen.getByText('Studio Two')).toBeInTheDocument()
  })

  it('hides a group that has no entries', () => {
    render(<LogoStrip clients={[withLogo]} partners={[]} />)
    expect(screen.queryByText('Partners')).not.toBeInTheDocument()
  })

  it('renders nothing when there are neither clients nor partners', () => {
    const { container } = render(<LogoStrip clients={[]} partners={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/logo-strip.test.tsx`
Expected: FAIL — cannot resolve `./logo-strip`.

- [ ] **Step 3: Implement it**

Create `components/logo-strip.tsx`:

```tsx
import Image from 'next/image'

import type { LogoRef } from '@/sanity/lib/content'
import { urlFor } from '@/sanity/lib/image'

function Logo({ entry }: { entry: LogoRef }) {
  const inner = entry.logo?.asset ? (
    <Image
      src={urlFor(entry.logo).width(400).auto('format').url()}
      alt={entry.name}
      width={140}
      height={70}
      className="h-10 w-auto object-contain opacity-60 transition-opacity duration-300 hover:opacity-100"
    />
  ) : (
    <span className="text-ink-muted transition-colors duration-300 hover:text-ink-soft">
      {entry.name}
    </span>
  )

  if (!entry.url) {
    return <div className="flex min-h-11 items-center">{inner}</div>
  }

  return (
    <a
      href={entry.url}
      target="_blank"
      rel="noreferrer"
      aria-label={entry.name}
      className="flex min-h-11 items-center"
    >
      {inner}
    </a>
  )
}

function Group({ title, entries }: { title: string; entries: LogoRef[] }) {
  if (entries.length === 0) return null

  return (
    <div>
      <h2 className="index-meta mb-8">{title}</h2>
      <div className="flex flex-wrap items-center gap-x-12 gap-y-8">
        {entries.map((entry) => (
          <Logo key={entry._id} entry={entry} />
        ))}
      </div>
    </div>
  )
}

export function LogoStrip({
  clients,
  partners,
}: {
  clients: LogoRef[]
  partners: LogoRef[]
}) {
  if (clients.length === 0 && partners.length === 0) return null

  return (
    <section className="flex flex-col gap-16 border-t border-hairline px-6 py-24">
      <Group title="Clients" entries={clients} />
      <Group title="Partners" entries={partners} />
    </section>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run components/logo-strip.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add components/logo-strip.tsx components/logo-strip.test.tsx
git commit -m "Add clients and partners logo strip"
```

---

### Task 7: Assemble the homepage

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: everything from Tasks 1–6, plus `getSiteSettings`/`getDisciplines` (Phase 1).
- Produces: the finished homepage and its metadata.

- [ ] **Step 1: Write the page**

Replace the contents of `app/page.tsx`:

```tsx
import { Suspense } from 'react'

import { FeaturedWork } from '@/components/featured-work'
import { HomeHero } from '@/components/home-hero'
import { LogoStrip } from '@/components/logo-strip'
import { Practices } from '@/components/practices'
import {
  getClients,
  getDisciplines,
  getFeaturedProjects,
  getPartners,
  getSiteSettings,
} from '@/sanity/lib/content'
import { urlFor } from '@/sanity/lib/image'

export async function generateMetadata() {
  const settings = await getSiteSettings()
  if (!settings) return {}

  const title = settings.seoTitle || `${settings.name}${settings.role ? ` — ${settings.role}` : ''}`
  const ogImage = settings.ogImage?.asset
    ? urlFor(settings.ogImage).width(1200).height(630).auto('format').url()
    : undefined

  return {
    title,
    description: settings.seoDescription,
    openGraph: {
      title,
      description: settings.seoDescription,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
  }
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeView />
    </Suspense>
  )
}

function HomeFallback() {
  return <div className="min-h-[70vh] animate-pulse bg-hairline" />
}

async function HomeView() {
  const [settings, disciplines, featured, clients, partners] = await Promise.all([
    getSiteSettings().catch(() => null),
    getDisciplines().catch(() => []),
    getFeaturedProjects().catch(() => []),
    getClients().catch(() => []),
    getPartners().catch(() => []),
  ])

  return (
    <>
      <HomeHero settings={settings} />
      <FeaturedWork projects={featured} />
      <Practices disciplines={disciplines} />
      <LogoStrip clients={clients} partners={partners} />
    </>
  )
}
```

Note each fetch is individually `.catch()`ed, matching the root layout's approach from Phase 2's fix wave: a Sanity outage degrades the homepage section by section instead of failing the whole page.

The contact close is already handled — `SiteFooter` (Phase 1) renders email, phone and Instagram on every page, so repeating it here would duplicate it.

- [ ] **Step 2: Verify the suite and the build**

Run: `npm test && npm run build`
Expected: all tests PASS; build succeeds. Confirm `/` still appears in the route table.

- [ ] **Step 3: Check for ad-hoc colours**

Run: `grep -rn "white/\|black/\|bg-\[#\|text-\[#" app components`
Expected: no hits.

- [ ] **Step 4: Verify the empty-dataset case FIRST**

This is the requirement Phase 3 taught us to check before anything else. With the dataset as it is now — zero projects, zero clients, zero partners, and a Site Settings document that may not exist — run `npm run dev` and open `http://localhost:3000`.

Expected: the page renders without throwing. If Site Settings is absent entirely, the hero renders nothing and the page is effectively empty below the header — that is correct behaviour, not a failure. Nothing should 500, and no section should render a heading with nothing under it.

Note in your report exactly what you saw.

- [ ] **Step 5: Verify with content**

In Studio, populate enough to exercise each section, then check the homepage after each:
1. Site Settings: set `name` and `role`, leave `heroVariant` at its default `type`. → hero shows the name at display size and the role beneath.
2. Create two Projects (Director / Music Videos and Director / Ads), give each a cover image, tick **Featured** on both, publish. → the featured section appears, the first full-bleed and the second half-width, both linking to their project pages.
3. Give one Discipline a cover image and a description. → the practices triptych shows it, linking to `/director`.
4. Create a Client with a name and a website but no logo, and a Partner with a name. → the strip shows both groups, the client's name as text, and its name links out.
5. Switch `heroVariant` to `still` without adding hero images. → the hero falls back to the typographic treatment rather than breaking.

- [ ] **Step 6: Clean up**

Delete the two test Projects, the test Client and the test Partner in Studio ("Delete all versions"). Leave Site Settings populated — a real site needs a name and role, and leaving them is closer to the client's starting state than blanking them. Confirm with `npx sanity documents query 'count(*[_type == "project"])'` (this CLI reports a zero count as an error reading "Query returned no results" — that is expected and means zero).

Re-run `npm run build` after the cleanup and confirm it still succeeds on the now-empty dataset.

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx
git commit -m "Assemble the homepage"
```

---

## Phase 4 done when

- `npm test` passes and `npm run build` succeeds **on an empty dataset**
- The homepage renders without error with no content at all, and each section appears only once it has something to show
- The client can switch the hero between the three treatments in Studio, and an unset asset falls back to the typographic hero rather than breaking
- Featured work runs in the full/half/half rhythm and links to project pages
- The triptych links to the three discipline pages
- Clients and partners appear, with names credited even where no logo is uploaded

## What Phase 4 deliberately leaves out

The About, Clients & Partners and Contact pages (Phase 5). Motion and page transitions, `mobileCoverImage` art direction, the `editorial` cadence's varied-height masonry, `previewLoop` hover previews, per-page OG images beyond the homepage, the performance-budget pass and the accessibility audit (Phase 6). The `reel` hero variant ships **unverified with real video**, pending the one-time human Mux credential setup in Studio — the same gap Phase 3 closed everything else around.
