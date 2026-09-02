# Amegah Portfolio — Phase 3: Project Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the individual project page at `/work/[slug]` — video or image hero, editorial metadata, description, gallery, and previous/next navigation — and wire up Mux so the client uploads video in Studio like everything else.

**Architecture:** Video is uploaded through Sanity Studio via `sanity-plugin-mux-input`, which stores a weak reference to a `mux.videoAsset` document holding the playback ID. The frontend follows that reference in GROQ and renders `@mux/mux-player-react` with the playback ID. Nothing about video requires a developer once the credentials are configured once. The page follows the same Next.js 16 shape as Phase 2 — `generateStaticParams` over CMS slugs, `params` awaited only inside a `<Suspense>` boundary — but has no `searchParams`, so it is simpler.

**Tech Stack:** Next.js 16 (App Router, Cache Components, PPR), React 19.2, TypeScript, Tailwind CSS v4, Sanity v5, Mux (`sanity-plugin-mux-input` + `@mux/mux-player-react`), Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-01-amegah-portfolio-design.md`
**Builds on:** Phase 1 (`…-phase-1-foundations.md`) and Phase 2 (`…-phase-2-work-browsing.md`), both complete.

## Global Constraints

- **Next.js 16 conventions only**, as established and verified in Phases 1–2:
  - `params` is a Promise, typed via the generated `PageProps<'/work/[slug]'>` helper. **Never await it at the top of the page component** — pass it into a `<Suspense>`-wrapped child. (This route has no `searchParams`, so it needs only one boundary, unlike Phase 2's page.)
  - **Never set the `dynamicParams` route segment config** — incompatible with `cacheComponents: true`, hard-errors the build. Unknown slugs render on request; `notFound()` handles ones that resolve to nothing.
  - `cacheTag` is variadic — tag every document type a query dereferences.
- **Disciplines and categories are never hardcoded in application code.** Only `scripts/seed-data.ts` may name them.
- **Design tokens only** — `bg-ground`, `text-ink`, `text-ink-soft`, `text-ink-muted`, `border-hairline`, `bg-hairline`, `font-display`, `.index-meta`. **No ad-hoc colours** — this constraint has now been violated twice in this project (`bg-white/5`, caught in Phase 2 Task 3 and again in Phase 2's final review). Before committing any task, run `grep -rn "white/\|black/\|bg-\[#\|text-\[#" app components` and confirm no new hits.
- **Colour palette (client brief §7):** background `#0A0A0A`, main text `#FFFFFF`, off-white subtext `#D8D8D3`, grey accents `#8A8A85`. No accent colour.
- **Touch targets ≥44px**, no hover-only affordances.
- **Never commit secrets.** `.env.local` is gitignored and holds `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` — never echo their values into a report, a commit, or a test fixture.
- **Video behaviour must satisfy client brief §4** — see the mapping table in Task 4.

## What is already provisioned

Mux is live: resource `mux-charcoal-crystal`, connected to the `amegah` Vercel project, with `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET` already pulled into `.env.local`. Free tier covers this site comfortably. **No task in this plan should run `vercel integration add`, `vercel env add`, or `vercel link`.**

Compatibility verified while planning, against the installed stack (Sanity 5.31.2, React 19.2.8, styled-components 6.5.3):
- `sanity-plugin-mux-input@5.0.12` — peers `react: ^19.2`, `sanity: ^5 || ^6.0.0-0`, `styled-components: ^6.1` ✅
- `@mux/mux-player-react@3.13.2` — peers `react: ^17 || ^18 || ^19` ✅

## Decisions this plan locks in

1. **Video is uploaded in Studio, not via a CLI.** Mux's own Next.js guide recommends `next-video`, which stores videos alongside code and requires a developer to add one. That directly contradicts the client brief's core requirement, so we use `sanity-plugin-mux-input` instead. The client uploads video in the same place they upload photographs.
2. **The project video does NOT autoplay.** Spec §7.3 allows autoplay only for "hero loop and hover previews", and the brief requires "never autoplay full videos on mobile data". A project page's video *is* the full film, so it renders with a poster and plays on user action, with sound. The `previewLoop` field (added in Phase 1, still unused) is what will autoplay muted in later phases.
3. **Poster images:** Mux auto-generates a poster from the video. When the project also has a `coverImage`, that wins — the client chose that frame deliberately, and it keeps the card and the page visually consistent.
4. **Previous/next navigation does not wrap around.** At the first project "previous" is absent, at the last "next" is absent. Wrapping makes a finite list feel like a loop with no end, which is worse for browsing a portfolio.
5. **Verification requires test content.** The dataset has zero projects, so this phase creates one test project with a real (locally generated) video upload, verifies end to end, then deletes it. Later phases will need to do the same until the client supplies real work.

---

### Task 1: Mux plugin and the `muxVideo` field

**Files:**
- Modify: `package.json` (add `sanity-plugin-mux-input`)
- Modify: `sanity.config.ts`
- Modify: `sanity/schemaTypes/project.ts`
- Modify: `sanity/schemaTypes/project.test.ts`

**Interfaces:**
- Consumes: the existing `project` document type (Phase 1).
- Produces: a `muxVideo` field of type `mux.video` on `project`, and the `muxInput()` plugin registered in the Studio.

- [ ] **Step 1: Install the plugin**

```bash
npm install sanity-plugin-mux-input
```

- [ ] **Step 2: Write the failing test**

Append to `sanity/schemaTypes/project.test.ts` (keep every existing test):

```ts
describe('project video field', () => {
  it('stores video as a Mux asset so the client uploads it in Studio', () => {
    expect(field('muxVideo')?.type).toBe('mux.video')
  })

  it('keeps previewLoop separate from the full video', () => {
    expect(field('previewLoop')?.type).toBe('file')
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run sanity/schemaTypes/project.test.ts`
Expected: FAIL — `muxVideo` is undefined.

- [ ] **Step 4: Add the field**

In `sanity/schemaTypes/project.ts`, add this field immediately after `mobileCoverImage` (so video sits with the other media, before `previewLoop`):

```ts
    defineField({
      name: 'muxVideo',
      title: 'Video',
      type: 'mux.video',
      description:
        'The full film. Uploaded straight to Mux — drag a file in and it streams itself.',
    }),
```

- [ ] **Step 5: Register the plugin in the Studio**

In `sanity.config.ts`, add the import and put `muxInput()` in the `plugins` array, after `structureTool(...)`:

```ts
import {muxInput} from 'sanity-plugin-mux-input'
```

```ts
  plugins: [
    structureTool({structure}),
    muxInput(),
    visionTool({defaultApiVersion: apiVersion}),
  ],
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run sanity/schemaTypes/project.test.ts`
Expected: PASS.

- [ ] **Step 7: Hand the Mux credential setup to the human — do NOT do it yourself**

The plugin does not read credentials from environment variables. The first time the Video field is opened, Studio shows a setup screen asking for the Mux **Access Token ID** and **Secret Key**; the values are then stored in the dataset as a `mux.apiKey` document with id `secrets.mux`, shared by all editors.

**This step is not yours to perform.** Typing an API token or secret into a form field is off-limits for an agent, whether directly or through browser automation — the human does it themselves. Do not open the setup screen and fill it in, do not read `MUX_TOKEN_SECRET`, and do not print either credential anywhere.

Instead, stop here and report that the task's code is complete and this one-time setup is outstanding, so the controller can hand it to the human. The human's instructions are:

> Run `npm run dev`, open `http://localhost:3000/studio`, create a Project, and open the **Video** field. When the setup screen appears, paste the Access Token ID and Secret Key — they are `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET` in `.env.local`. Confirm the field then shows an upload dropzone. If the token is rejected, check in the Mux dashboard that it has read+write on Video and read on Data.

Task 7's live verification depends on this being done, but Tasks 2–6 do not, so execution can continue in the meantime.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json sanity.config.ts sanity/schemaTypes/
git commit -m "Add Mux video field and Studio plugin"
```

---

### Task 2: Project detail query and cached data layer

**Files:**
- Modify: `sanity/lib/queries.ts`
- Modify: `sanity/lib/queries.test.ts`
- Modify: `sanity/lib/content.ts`

**Interfaces:**
- Consumes: `IMAGE_PROJECTION` and `TAGS` (Phases 1–2).
- Produces:
  - `PROJECT_DETAIL_QUERY`, `DISCIPLINE_PROJECT_REFS_QUERY`, `ALL_PROJECT_SLUGS_QUERY`
  - `type GalleryImage = SanityImage & { alt?: string; caption?: string }`
  - `type MuxVideo = { playbackId?: string; assetId?: string }`
  - `type ProjectDetail` (full shape below)
  - `type ProjectRef = { slug: string; title: string }`
  - `getProjectBySlug(slug): Promise<ProjectDetail | null>`
  - `getDisciplineProjectRefs(disciplineSlug): Promise<ProjectRef[]>`
  - `getAllProjectSlugs(): Promise<string[]>`

- [ ] **Step 1: Write the failing tests**

Append to `sanity/lib/queries.test.ts`, adding the new names to the existing import:

```ts
describe('PROJECT_DETAIL_QUERY', () => {
  it('looks up one non-archived project by slug', () => {
    expect(PROJECT_DETAIL_QUERY).toContain('_type == "project"')
    expect(PROJECT_DETAIL_QUERY).toContain('slug.current == $slug')
    expect(PROJECT_DETAIL_QUERY).toContain('!archived')
    expect(PROJECT_DETAIL_QUERY).toContain('[0]')
  })

  it('follows the Mux asset reference to the playback id', () => {
    expect(PROJECT_DETAIL_QUERY).toContain('muxVideo.asset->')
    expect(PROJECT_DETAIL_QUERY).toContain('playbackId')
  })

  it('returns gallery images with their alt text and captions', () => {
    expect(PROJECT_DETAIL_QUERY).toContain('gallery')
    expect(PROJECT_DETAIL_QUERY).toContain('alt')
    expect(PROJECT_DETAIL_QUERY).toContain('caption')
  })

  it('resolves the credits the page shows', () => {
    expect(PROJECT_DETAIL_QUERY).toContain('client->')
    expect(PROJECT_DETAIL_QUERY).toContain('partners[]->')
  })
})

describe('DISCIPLINE_PROJECT_REFS_QUERY', () => {
  it('lists a discipline’s projects in the editor-defined order', () => {
    expect(DISCIPLINE_PROJECT_REFS_QUERY).toContain(
      'discipline->slug.current == $disciplineSlug',
    )
    expect(DISCIPLINE_PROJECT_REFS_QUERY).toContain('order(orderRank)')
    expect(DISCIPLINE_PROJECT_REFS_QUERY).toContain('!archived')
  })
})

describe('ALL_PROJECT_SLUGS_QUERY', () => {
  it('lists every non-archived project slug for prerendering', () => {
    expect(ALL_PROJECT_SLUGS_QUERY).toContain('_type == "project"')
    expect(ALL_PROJECT_SLUGS_QUERY).toContain('!archived')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run sanity/lib/queries.test.ts`
Expected: FAIL — the three new queries are not exported.

- [ ] **Step 3: Add the queries**

First, split the existing `IMAGE_PROJECTION` so its field list can be reused inside a larger projection. GROQ has no reliable way to spread an inline object literal (`...{a, b}`), so the fields must be interpolated directly rather than spread. Replace the existing `IMAGE_PROJECTION` declaration at the top of `sanity/lib/queries.ts` with:

```ts
export const IMAGE_FIELDS = `asset,
  hotspot,
  "lqip": asset->metadata.lqip,
  "aspectRatio": asset->metadata.dimensions.aspectRatio`

export const IMAGE_PROJECTION = `{
  ${IMAGE_FIELDS}
}`
```

This leaves `IMAGE_PROJECTION`'s value equivalent, so Phase 2's tests asserting it contains `lqip` and `hotspot` still pass, and every existing use of it is unchanged.

Then append the new queries (leave everything else already in the file unchanged):

```ts
export const PROJECT_DETAIL_QUERY = `*[_type == "project" && slug.current == $slug && !archived][0] {
  _id,
  title,
  "slug": slug.current,
  year,
  description,
  "coverImage": coverImage${IMAGE_PROJECTION},
  "muxVideo": muxVideo.asset->{playbackId, assetId},
  "gallery": gallery[]{
    ${IMAGE_FIELDS},
    alt,
    caption
  },
  "discipline": discipline->{title, "slug": slug.current, cadence},
  "category": category->{
    title,
    "slug": slug.current,
    "parentSlug": parent->slug.current
  },
  "client": client->{name},
  "partners": partners[]->{name}
}`

export const DISCIPLINE_PROJECT_REFS_QUERY = `*[_type == "project" && !archived && discipline->slug.current == $disciplineSlug] | order(orderRank) {
  "slug": slug.current,
  title
}`

export const ALL_PROJECT_SLUGS_QUERY = `*[_type == "project" && !archived].slug.current`
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run sanity/lib/queries.test.ts`
Expected: PASS.

- [ ] **Step 5: Add the types and cached getters**

In `sanity/lib/content.ts`, add to the existing imports:

```ts
import {
  ALL_PROJECT_SLUGS_QUERY,
  DISCIPLINE_PROJECT_REFS_QUERY,
  PROJECT_DETAIL_QUERY,
} from './queries'
```

Then append:

```ts
export type GalleryImage = SanityImage & {
  alt?: string
  caption?: string
}

export type MuxVideo = {
  playbackId?: string
  assetId?: string
}

/**
 * Portable Text as it comes back from Sanity. Structurally compatible with
 * what `<PortableText>` accepts, so no cast is needed at the call site.
 */
export type PortableTextValue = { _type: string; _key?: string }[]

export type ProjectRef = {
  slug: string
  title: string
}

export type ProjectDetail = {
  _id: string
  title: string
  slug: string
  year?: number
  description?: PortableTextValue
  coverImage?: SanityImage
  muxVideo?: MuxVideo | null
  gallery?: GalleryImage[]
  discipline: { title: string; slug: string; cadence: Cadence }
  category: { title: string; slug: string; parentSlug: string | null } | null
  client?: { name: string } | null
  partners?: { name: string }[] | null
}

export async function getProjectBySlug(slug: string): Promise<ProjectDetail | null> {
  'use cache'
  // Dereferences discipline, category, client, partners and the Mux asset,
  // so a change to any of them must invalidate this page.
  cacheTag(TAGS.project, TAGS.discipline, TAGS.category, TAGS.client, TAGS.partner)
  cacheLife('max')
  return client.fetch<ProjectDetail | null>(PROJECT_DETAIL_QUERY, { slug })
}

export async function getDisciplineProjectRefs(
  disciplineSlug: string,
): Promise<ProjectRef[]> {
  'use cache'
  cacheTag(TAGS.project, TAGS.discipline)
  cacheLife('max')
  return client.fetch<ProjectRef[]>(DISCIPLINE_PROJECT_REFS_QUERY, { disciplineSlug })
}

export async function getAllProjectSlugs(): Promise<string[]> {
  'use cache'
  cacheTag(TAGS.project)
  cacheLife('max')
  return client.fetch<string[]>(ALL_PROJECT_SLUGS_QUERY)
}
```

- [ ] **Step 6: Verify**

Run: `npm test && npx tsc --noEmit`
Expected: all tests PASS, no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add sanity/lib/
git commit -m "Add project detail query and cached getters"
```

---

### Task 3: Previous/next adjacency

**Files:**
- Create: `lib/adjacent-projects.ts`
- Create: `lib/adjacent-projects.test.ts`

**Interfaces:**
- Consumes: `ProjectRef` (Task 2).
- Produces: `adjacentProjects(projects: ProjectRef[], currentSlug: string): { prev: ProjectRef | null; next: ProjectRef | null }` — non-wrapping, per decision 4.

- [ ] **Step 1: Write the failing test**

Create `lib/adjacent-projects.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { adjacentProjects } from './adjacent-projects'
import type { ProjectRef } from '@/sanity/lib/content'

const refs: ProjectRef[] = [
  { slug: 'first', title: 'First' },
  { slug: 'middle', title: 'Middle' },
  { slug: 'last', title: 'Last' },
]

describe('adjacentProjects', () => {
  it('finds the neighbours on both sides', () => {
    expect(adjacentProjects(refs, 'middle')).toEqual({
      prev: { slug: 'first', title: 'First' },
      next: { slug: 'last', title: 'Last' },
    })
  })

  it('has no previous at the start of the list', () => {
    expect(adjacentProjects(refs, 'first')).toEqual({
      prev: null,
      next: { slug: 'middle', title: 'Middle' },
    })
  })

  it('has no next at the end of the list — the list does not wrap', () => {
    expect(adjacentProjects(refs, 'last')).toEqual({
      prev: { slug: 'middle', title: 'Middle' },
      next: null,
    })
  })

  it('gives a lone project no neighbours', () => {
    expect(adjacentProjects([refs[0]], 'first')).toEqual({ prev: null, next: null })
  })

  it('returns nothing for a project that is not in the list', () => {
    expect(adjacentProjects(refs, 'archived-one')).toEqual({ prev: null, next: null })
  })

  it('returns nothing for an empty list', () => {
    expect(adjacentProjects([], 'first')).toEqual({ prev: null, next: null })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/adjacent-projects.test.ts`
Expected: FAIL — cannot resolve `./adjacent-projects`.

- [ ] **Step 3: Implement it**

Create `lib/adjacent-projects.ts`:

```ts
import type { ProjectRef } from '@/sanity/lib/content'

/**
 * Finds the projects either side of the current one, in the editor's order.
 *
 * The list deliberately does not wrap: at the ends, one side is simply absent,
 * so a visitor can tell they have reached the edge of the work.
 */
export function adjacentProjects(
  projects: ProjectRef[],
  currentSlug: string,
): { prev: ProjectRef | null; next: ProjectRef | null } {
  const index = projects.findIndex((project) => project.slug === currentSlug)
  if (index === -1) {
    return { prev: null, next: null }
  }
  return {
    prev: projects[index - 1] ?? null,
    next: projects[index + 1] ?? null,
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/adjacent-projects.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/adjacent-projects.ts lib/adjacent-projects.test.ts
git commit -m "Add previous/next project adjacency"
```

---

### Task 4: Video player

**Files:**
- Create: `lib/video-poster.ts`
- Create: `lib/video-poster.test.ts`
- Create: `components/project-video.tsx`
- Create: `components/project-video.test.tsx`
- Modify: `package.json` (add `@mux/mux-player-react`)

**Interfaces:**
- Consumes: `SanityImage`, `MuxVideo` (Tasks 1–2), `urlFor` (Phase 1).
- Produces:
  - `posterUrl(coverImage?: SanityImage): string | undefined` — the client's chosen frame, or `undefined` to let Mux generate one
  - `<ProjectVideo playbackId={string} title={string} poster={string | undefined} />`

This task is where client brief §4 is satisfied:

| Brief §4 requirement | How this component meets it |
|---|---|
| Autoplay where appropriate | Deliberately **not** here — this is the full film (decision 2). `previewLoop` covers autoplay in later phases. |
| Muted playback for background/showreel | Not applicable to full playback; the film plays with its own sound when the visitor starts it. |
| Poster/thumbnail images | `poster` prop — the project's `coverImage` when set, otherwise Mux's generated thumbnail. |
| Fullscreen playback | Mux Player's native fullscreen control, enabled by default. |
| Mobile compatibility | `playsInline` so iOS plays in place rather than hijacking fullscreen; Mux streams adaptive bitrate; nothing plays until the visitor taps. |

- [ ] **Step 1: Install the player**

```bash
npm install @mux/mux-player-react
```

- [ ] **Step 2: Write the failing test for the poster helper**

Create `lib/video-poster.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { posterUrl } from './video-poster'

describe('posterUrl', () => {
  it('lets Mux generate a poster when the project has no cover image', () => {
    expect(posterUrl(undefined)).toBeUndefined()
    expect(posterUrl({})).toBeUndefined()
  })

  it('prefers the cover image the client chose', () => {
    const url = posterUrl({ asset: { _ref: 'image-abc-1600x900-jpg' } })
    expect(url).toContain('cdn.sanity.io')
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run lib/video-poster.test.ts`
Expected: FAIL — cannot resolve `./video-poster`.

- [ ] **Step 4: Implement the poster helper**

Create `lib/video-poster.ts`:

```ts
import type { SanityImage } from '@/sanity/lib/content'
import { urlFor } from '@/sanity/lib/image'

/**
 * The poster frame for a project's video.
 *
 * When the client has chosen a cover image, that is the frame they want the
 * work to be represented by, so it wins. Otherwise we return nothing and let
 * Mux generate a thumbnail from the video itself.
 */
export function posterUrl(coverImage?: SanityImage): string | undefined {
  if (!coverImage?.asset) return undefined
  return urlFor(coverImage).width(1920).auto('format').url()
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run lib/video-poster.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Write the failing test for the player**

Create `components/project-video.test.tsx`. Mux Player is a custom element that jsdom does not meaningfully render, so these tests assert on what we pass it rather than on playback behaviour — real playback is verified live in Task 7.

```tsx
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ProjectVideo } from './project-video'

vi.mock('@mux/mux-player-react', () => ({
  default: (props: Record<string, unknown>) => (
    <div
      data-testid="mux-player"
      data-playback-id={props.playbackId as string}
      data-poster={(props.poster as string) ?? ''}
      data-plays-inline={String(props.playsInline)}
      data-autoplay={String(props.autoPlay ?? false)}
    />
  ),
}))

describe('ProjectVideo', () => {
  it('plays the requested Mux asset', () => {
    const { getByTestId } = render(<ProjectVideo playbackId="abc123" title="Nightfall" />)
    expect(getByTestId('mux-player')).toHaveAttribute('data-playback-id', 'abc123')
  })

  it('never autoplays the full film', () => {
    const { getByTestId } = render(<ProjectVideo playbackId="abc123" title="Nightfall" />)
    expect(getByTestId('mux-player')).toHaveAttribute('data-autoplay', 'false')
  })

  it('plays inline so iOS does not hijack the screen', () => {
    const { getByTestId } = render(<ProjectVideo playbackId="abc123" title="Nightfall" />)
    expect(getByTestId('mux-player')).toHaveAttribute('data-plays-inline', 'true')
  })

  it('uses the poster it is given', () => {
    const { getByTestId } = render(
      <ProjectVideo playbackId="abc123" title="Nightfall" poster="https://cdn.example/x.jpg" />,
    )
    expect(getByTestId('mux-player')).toHaveAttribute(
      'data-poster',
      'https://cdn.example/x.jpg',
    )
  })
})
```

- [ ] **Step 7: Run the test to verify it fails**

Run: `npx vitest run components/project-video.test.tsx`
Expected: FAIL — cannot resolve `./project-video`.

- [ ] **Step 8: Implement the player**

Create `components/project-video.tsx`:

```tsx
'use client'

import MuxPlayer from '@mux/mux-player-react'

/**
 * The full film on a project page.
 *
 * It does not autoplay: this is the work itself, not a background loop, and
 * the brief is explicit that full videos must never start themselves on
 * mobile data. The visitor presses play, and it plays with its own sound.
 */
export function ProjectVideo({
  playbackId,
  title,
  poster,
}: {
  playbackId: string
  title: string
  poster?: string
}) {
  return (
    <MuxPlayer
      playbackId={playbackId}
      poster={poster}
      title={title}
      streamType="on-demand"
      playsInline
      autoPlay={false}
      metadata={{ video_title: title }}
      accentColor="#ffffff"
      style={{ width: '100%', aspectRatio: '16 / 9' }}
    />
  )
}
```

- [ ] **Step 9: Run the test to verify it passes**

Run: `npx vitest run components/project-video.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 10: Commit**

```bash
git add lib/video-poster.ts lib/video-poster.test.ts components/project-video.tsx components/project-video.test.tsx package.json package-lock.json
git commit -m "Add Mux video player for project pages"
```

---

### Task 5: Project hero

**Files:**
- Create: `components/project-hero.tsx`
- Create: `components/project-hero.test.tsx`

**Interfaces:**
- Consumes: `ProjectVideo` (Task 4), `posterUrl` (Task 4), `hotspotPosition` (Phase 2), `urlFor` (Phase 1), `ProjectDetail` (Task 2).
- Produces: `<ProjectHero project={ProjectDetail} />` — the video when the project has one, otherwise the cover image, otherwise nothing.

- [ ] **Step 1: Write the failing test**

Create `components/project-hero.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ProjectHero } from './project-hero'
import type { ProjectDetail } from '@/sanity/lib/content'

vi.mock('./project-video', () => ({
  ProjectVideo: ({ playbackId }: { playbackId: string }) => (
    <div data-testid="project-video" data-playback-id={playbackId} />
  ),
}))

const base: ProjectDetail = {
  _id: 'p1',
  title: 'Nightfall',
  slug: 'nightfall',
  year: 2025,
  coverImage: { asset: { _ref: 'image-abc-1600x900-jpg' } },
  discipline: { title: 'Director', slug: 'director', cadence: 'cinematic' },
  category: { title: 'Music Videos', slug: 'music-videos', parentSlug: null },
}

describe('ProjectHero', () => {
  it('plays the film when the project has one', () => {
    render(<ProjectHero project={{ ...base, muxVideo: { playbackId: 'pb1' } }} />)
    expect(screen.getByTestId('project-video')).toHaveAttribute('data-playback-id', 'pb1')
  })

  it('falls back to the cover image for photography', () => {
    render(<ProjectHero project={base} />)
    expect(screen.queryByTestId('project-video')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Nightfall' })).toBeInTheDocument()
  })

  it('treats a video with no playback id as no video', () => {
    render(<ProjectHero project={{ ...base, muxVideo: { assetId: 'a1' } }} />)
    expect(screen.queryByTestId('project-video')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Nightfall' })).toBeInTheDocument()
  })

  it('renders nothing rather than crashing when the project has no media', () => {
    const { container } = render(
      <ProjectHero project={{ ...base, coverImage: undefined }} />,
    )
    expect(container.querySelector('img')).toBeNull()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/project-hero.test.tsx`
Expected: FAIL — cannot resolve `./project-hero`.

- [ ] **Step 3: Implement the hero**

Create `components/project-hero.tsx`:

```tsx
import Image from 'next/image'

import { hotspotPosition } from '@/lib/card-meta'
import { posterUrl } from '@/lib/video-poster'
import type { ProjectDetail } from '@/sanity/lib/content'
import { urlFor } from '@/sanity/lib/image'
import { ProjectVideo } from './project-video'

export function ProjectHero({ project }: { project: ProjectDetail }) {
  const playbackId = project.muxVideo?.playbackId

  if (playbackId) {
    return (
      <div className="bg-hairline">
        <ProjectVideo
          playbackId={playbackId}
          title={project.title}
          poster={posterUrl(project.coverImage)}
        />
      </div>
    )
  }

  if (!project.coverImage?.asset) {
    return null
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-hairline">
      <Image
        src={urlFor(project.coverImage).width(2400).auto('format').url()}
        alt={project.title}
        fill
        priority
        sizes="100vw"
        placeholder={project.coverImage.lqip ? 'blur' : 'empty'}
        blurDataURL={project.coverImage.lqip}
        style={{ objectPosition: hotspotPosition(project.coverImage) }}
        className="object-cover"
      />
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run components/project-hero.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add components/project-hero.tsx components/project-hero.test.tsx
git commit -m "Add project hero with video or image"
```

---

### Task 6: Credits, description and gallery

**Files:**
- Create: `lib/credits.ts`
- Create: `lib/credits.test.ts`
- Create: `components/project-gallery.tsx`
- Create: `components/project-gallery.test.tsx`
- Modify: `package.json` (add `@portabletext/react` as a direct dependency)

**Interfaces:**
- Consumes: `ProjectDetail`, `GalleryImage` (Task 2), `hotspotPosition` (Phase 2), `urlFor` (Phase 1).
- Produces:
  - `creditLine(project: ProjectDetail): string` — the archival metadata line, e.g. `Director · Music Videos · 2025`
  - `<ProjectGallery images={GalleryImage[]} title={string} />`

Note `@portabletext/react` is currently only present transitively via `next-sanity`. Application code importing it directly must declare it, so `package.json` reflects what the app actually uses.

- [ ] **Step 1: Write the failing test for the credit line**

Create `lib/credits.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { creditLine } from './credits'
import type { ProjectDetail } from '@/sanity/lib/content'

const base: ProjectDetail = {
  _id: 'p1',
  title: 'Nightfall',
  slug: 'nightfall',
  discipline: { title: 'Director', slug: 'director', cadence: 'cinematic' },
  category: { title: 'Music Videos', slug: 'music-videos', parentSlug: null },
}

describe('creditLine', () => {
  it('reads discipline, category and year', () => {
    expect(creditLine({ ...base, year: 2025 })).toBe('Director · Music Videos · 2025')
  })

  it('omits a year the client has not filled in', () => {
    expect(creditLine(base)).toBe('Director · Music Videos')
  })

  it('omits a category a project has not been filed under', () => {
    expect(creditLine({ ...base, category: null, year: 2025 })).toBe('Director · 2025')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/credits.test.ts`
Expected: FAIL — cannot resolve `./credits`.

- [ ] **Step 3: Implement the credit line**

Create `lib/credits.ts`:

```ts
import type { ProjectDetail } from '@/sanity/lib/content'

/**
 * The archival metadata line on a project page — the same device the cards
 * use, without the running index. Empty parts are dropped, never printed
 * as gaps.
 */
export function creditLine(project: ProjectDetail): string {
  return [project.discipline?.title, project.category?.title, project.year]
    .filter(Boolean)
    .join(' · ')
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/credits.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Install the Portable Text renderer as a direct dependency**

```bash
npm install @portabletext/react
```

- [ ] **Step 6: Write the failing test for the gallery**

Create `components/project-gallery.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ProjectGallery } from './project-gallery'
import type { GalleryImage } from '@/sanity/lib/content'

const images: GalleryImage[] = [
  { asset: { _ref: 'image-a-1600x900-jpg' }, alt: 'On location at dawn' },
  { asset: { _ref: 'image-b-1600x900-jpg' }, caption: 'Second unit' },
]

describe('ProjectGallery', () => {
  it('renders every image', () => {
    render(<ProjectGallery images={images} title="Nightfall" />)
    expect(screen.getAllByRole('img')).toHaveLength(2)
  })

  it('uses the alt text the client wrote', () => {
    render(<ProjectGallery images={images} title="Nightfall" />)
    expect(screen.getByRole('img', { name: 'On location at dawn' })).toBeInTheDocument()
  })

  it('falls back to the project title when an image has no alt text', () => {
    render(<ProjectGallery images={images} title="Nightfall" />)
    expect(screen.getByRole('img', { name: 'Nightfall' })).toBeInTheDocument()
  })

  it('shows captions where the client wrote one', () => {
    render(<ProjectGallery images={images} title="Nightfall" />)
    expect(screen.getByText('Second unit')).toBeInTheDocument()
  })

  it('renders nothing for an empty gallery', () => {
    const { container } = render(<ProjectGallery images={[]} title="Nightfall" />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 7: Run the test to verify it fails**

Run: `npx vitest run components/project-gallery.test.tsx`
Expected: FAIL — cannot resolve `./project-gallery`.

- [ ] **Step 8: Implement the gallery**

Create `components/project-gallery.tsx`:

```tsx
import Image from 'next/image'

import { hotspotPosition } from '@/lib/card-meta'
import type { GalleryImage } from '@/sanity/lib/content'
import { urlFor } from '@/sanity/lib/image'

export function ProjectGallery({
  images,
  title,
}: {
  images: GalleryImage[]
  title: string
}) {
  if (images.length === 0) {
    return null
  }

  return (
    <div className="mt-24 flex flex-col gap-16">
      {images.map((image, index) =>
        image.asset ? (
          <figure key={image.asset._ref ?? index}>
            <div className="relative aspect-[3/2] w-full overflow-hidden bg-hairline">
              <Image
                src={urlFor(image).width(2000).auto('format').url()}
                alt={image.alt || title}
                fill
                loading="lazy"
                sizes="(min-width: 1024px) 80vw, 100vw"
                placeholder={image.lqip ? 'blur' : 'empty'}
                blurDataURL={image.lqip}
                style={{ objectPosition: hotspotPosition(image) }}
                className="object-cover"
              />
            </div>
            {image.caption && <figcaption className="index-meta mt-3">{image.caption}</figcaption>}
          </figure>
        ) : null,
      )}
    </div>
  )
}
```

- [ ] **Step 9: Run the test to verify it passes**

Run: `npx vitest run components/project-gallery.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 10: Commit**

```bash
git add lib/credits.ts lib/credits.test.ts components/project-gallery.tsx components/project-gallery.test.tsx package.json package-lock.json
git commit -m "Add credit line and project gallery"
```

---

### Task 7: The project page route

**Files:**
- Create: `app/work/[slug]/page.tsx`

**Interfaces:**
- Consumes: everything from Tasks 2–6, plus `buildCategoryTree` is *not* needed here.
- Produces: the `/work/[slug]` route, `generateStaticParams`, `generateMetadata`.

- [ ] **Step 1: Write the page**

Create `app/work/[slug]/page.tsx`:

```tsx
import { PortableText } from '@portabletext/react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { ProjectGallery } from '@/components/project-gallery'
import { ProjectHero } from '@/components/project-hero'
import { adjacentProjects } from '@/lib/adjacent-projects'
import { creditLine } from '@/lib/credits'
import {
  getAllProjectSlugs,
  getDisciplineProjectRefs,
  getProjectBySlug,
} from '@/sanity/lib/content'

export async function generateStaticParams() {
  const slugs = await getAllProjectSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps<'/work/[slug]'>) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) return {}
  return {
    title: `${project.title} — Amegah`,
    description: creditLine(project),
  }
}

export default function ProjectPage({ params }: PageProps<'/work/[slug]'>) {
  return (
    <Suspense fallback={<ProjectFallback />}>
      <ProjectView params={params} />
    </Suspense>
  )
}

function ProjectFallback() {
  return (
    <div>
      <div className="aspect-video w-full animate-pulse bg-hairline" />
      <div className="px-6 py-16">
        <div className="h-10 w-72 animate-pulse bg-hairline" />
      </div>
    </div>
  )
}

async function ProjectView({ params }: Pick<PageProps<'/work/[slug]'>, 'params'>) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)

  if (!project) {
    notFound()
  }

  const siblings = await getDisciplineProjectRefs(project.discipline.slug)
  const { prev, next } = adjacentProjects(siblings, project.slug)
  const partners = project.partners ?? []

  return (
    <article>
      <ProjectHero project={project} />

      <div className="px-6 py-16 md:py-24">
        <p className="index-meta">{creditLine(project)}</p>
        <h1
          className="font-display mt-3 text-ink"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.05 }}
        >
          {project.title}
        </h1>

        {(project.client || partners.length > 0) && (
          <dl className="mt-10 flex flex-col gap-4 sm:flex-row sm:gap-16">
            {project.client && (
              <div>
                <dt className="index-meta">Client</dt>
                <dd className="mt-1 text-ink-soft">{project.client.name}</dd>
              </div>
            )}
            {partners.length > 0 && (
              <div>
                <dt className="index-meta">Partners</dt>
                <dd className="mt-1 text-ink-soft">
                  {partners.map((partner) => partner.name).join(', ')}
                </dd>
              </div>
            )}
          </dl>
        )}

        {project.description ? (
          <div className="mt-12 max-w-[var(--measure)] text-ink-soft [&_p]:mt-4">
            <PortableText value={project.description} />
          </div>
        ) : null}

        <ProjectGallery images={project.gallery ?? []} title={project.title} />

        <nav className="mt-32 flex items-center justify-between border-t border-hairline pt-8">
          {prev ? (
            <Link href={`/work/${prev.slug}`} className="index-meta min-h-11 hover:text-ink">
              ← {prev.title}
            </Link>
          ) : (
            <span />
          )}
          <Link
            href={`/${project.discipline.slug}`}
            className="index-meta min-h-11 hover:text-ink"
          >
            All {project.discipline.title}
          </Link>
          {next ? (
            <Link href={`/work/${next.slug}`} className="index-meta min-h-11 hover:text-ink">
              {next.title} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </div>
    </article>
  )
}
```

- [ ] **Step 2: Verify the build and the suite**

Run: `npm test && npm run build`
Expected: all tests PASS; the build succeeds. Confirm no Cache Components error about `params` being read outside a Suspense boundary, and that `/work/[slug]` appears in the route table.

- [ ] **Step 3: Check for ad-hoc colours before going further**

Run: `grep -rn "white/\|black/\|bg-\[#\|text-\[#" app components`
Expected: no hits. This constraint has been violated twice already in this project; this is the gate.

- [ ] **Step 4: Create the test content**

Generate a small test video locally (5 seconds of colour bars with a tone — no downloading, nothing copyrighted):

```bash
ffmpeg -f lavfi -i testsrc=size=1280x720:rate=30:duration=5 -f lavfi -i sine=frequency=440:duration=5 -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest /tmp/amegah-test-clip.mp4
```

Run `npm run dev`, open `http://localhost:3000/studio`, and create a Project:
- Title `Test Film`, slug `test-film`
- Discipline: Director. Category: Music Videos
- Video: upload `/tmp/amegah-test-clip.mp4` and wait for Mux to finish processing (the field shows progress, then a preview)
- Publish

Create a second Project — Title `Test Stills`, slug `test-stills`, Discipline Director, Category Ads, no video — and publish it, so previous/next navigation has something to point at.

- [ ] **Step 5: Verify live**

With the dev server running, check each of these and note exactly what you see:
- `http://localhost:3000/work/test-film` — the Mux player renders with a poster, does **not** start playing on its own, and plays when clicked. Confirm the fullscreen control works and audio plays.
- Narrow the window below 768px and confirm the player still fits, does not autoplay, and plays inline rather than taking over the screen.
- The credit line reads `Director · Music Videos` (plus the year if you set one), the title renders in Fraunces, and previous/next links appear at the foot.
- `http://localhost:3000/work/test-stills` — no player, the cover image (or nothing, if you left it empty) in the hero, and a previous/next link pointing at the other test project.
- `http://localhost:3000/director` — both test projects now appear in the grid, and clicking a card lands on its project page. (Phase 2's cards linked to `/work/[slug]`, which 404'd until now — confirm those links work.)
- `http://localhost:3000/work/not-a-real-project` — renders the 404 page.
- `http://localhost:3000/studio` — still loads.

- [ ] **Step 6: Clean up the test content**

Delete both test Projects in Studio ("Delete all versions"). Then confirm the dataset is back to its seeded state:

```bash
npx sanity documents query 'count(*[_type == "project"])'
```
Expected: `0`.

Also delete the uploaded test video so it does not sit in the client's Mux account: in Studio the Mux field has an option to delete the asset, or remove it from the Mux dashboard. Note in your report which route you used and confirm it is gone. Finally, remove the local file: `rm /tmp/amegah-test-clip.mp4`.

- [ ] **Step 7: Commit**

```bash
git add app/work/
git commit -m "Add project detail pages with video, gallery and prev/next"
```

---

## Phase 3 done when

- `npm test` passes and `npm run build` succeeds
- A project with a Mux video renders a player that shows a poster, does not autoplay, plays with sound on tap, and goes fullscreen
- A project without a video renders its cover image instead
- Credits, description and gallery render, with captions and alt text where the client wrote them
- Previous/next navigation moves between projects within a discipline and stops at the ends
- Phase 2's project cards now lead somewhere — `/work/[slug]` no longer 404s
- The dataset and the Mux account are left exactly as they were found

## What Phase 3 deliberately leaves out

The homepage — hero variants, featured work, the discipline triptych, the client/partner strip (Phase 4). About, Clients & Partners and Contact pages (Phase 5). Motion and page transitions, `mobileCoverImage` art direction, the `editorial` cadence's varied-height masonry, OG images, the performance-budget pass and the accessibility audit (Phase 6). The `previewLoop` field stays unused until the homepage needs an autoplaying showreel.
