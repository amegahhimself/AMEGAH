# Amegah Portfolio — Phase 5: About, Clients & Contact

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the three remaining pages — About, Clients & Partners, and Contact — resolving the navigation links that have pointed nowhere since Phase 1.

**Architecture:** All three read the Site Settings singleton (plus the client/partner documents already queried in Phase 4). No new content types. The Clients page reuses Phase 4's `LogoStrip` rather than reimplementing it, and the Portable Text renderer written inline in Phase 3's project page is extracted so About and project pages share one definition of what a link looks like.

**Tech Stack:** Next.js 16 (App Router, Cache Components, PPR), React 19.2, TypeScript, Tailwind CSS v4, Sanity v5, Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-01-amegah-portfolio-design.md` (§6.5 for these pages, §4 for the routes)
**Builds on:** Phases 1–4, all merged to `main`.

## Spec-diff pass

Phase 4's plan quietly dropped two elements the spec named (the triptych's category list, the hero's scroll cue) without recording them as deferred. That review finding produced a standing requirement: **enumerate every element the spec names for this phase and mark each built or deferred, before execution.** Spec §6.5 in full:

| Spec element (§6.5) | Decision |
|---|---|
| About — large editorial headshot | **Build** (Task 3) |
| About — bio in serif | **Build** (Task 3) |
| About — bio at a ~65ch measure | **Build** — the `--measure` token exists and is finally used here (Task 3) |
| Clients — two labelled sections | **Build** — `LogoStrip` already renders exactly this (Task 4) |
| Clients — logo grids | **Build** (Task 4) |
| Clients — links out where a `url` exists | **Build** — already `LogoStrip` behaviour (Task 4) |
| Contact — email as large clickable display type | **Build** (Task 5) |
| Contact — phone | **Build** (Task 5) |
| Contact — Instagram | **Build** (Task 5) |
| Contact — **no** contact form | **Deliberately not built.** The spec argues it: the brief asks only for contact information, and a form adds a backend, a spam surface and deliverability problems for no requested benefit. |

Nothing in §6.5 is deferred. The routes in §4 (`/about`, `/clients`, `/contact`) are all built here.

## Defects found while planning (fix in Task 1, before any page is built)

Reading the existing code turned up four problems, two of which are repeats of bug classes already caught in earlier phases:

1. **`headshot` is projected raw** in `SITE_SETTINGS_QUERY` — no `IMAGE_FIELDS` — so `lqip` and `hotspot` are undefined at the point the About page would use them. This is exactly the `DISCIPLINES_QUERY` bug found in Phase 4's planning.
2. **`bio` is the unrestricted default block type** (`of: [{ type: 'block' }]`), so it permits H1–H6, blockquote and lists that the page has no styling for. This is exactly the Phase 3 finding about `project.description`, on a field that escaped it.
3. **`headshot` and `bio` are typed `unknown`**, which forces casts at every point of use.
4. **Phase 3's Portable Text `components` map is defined inline** inside `app/work/[slug]/page.tsx`. About needs the same link treatment; duplicating it lets the two drift.

## Global Constraints

- **Next.js 16 conventions only.** These three routes are static — no `params`, no `searchParams` — so they need no dynamic-params handling. **Never add `generateStaticParams`**: it has nothing to enumerate here, and over CMS content it hard-errors on an empty dataset (the Phase 3 build break).
- **Empty-dataset resilience is a standing requirement.** Every page must render sensibly when Site Settings is unpopulated or absent. A page whose only content is missing should say something human, not render an empty shell — and never throw.
- **Design tokens only** — `bg-ground`, `text-ink`, `text-ink-soft`, `text-ink-muted`, `border-hairline`, `bg-hairline`, `font-display`, `.index-meta`, `--measure`. **No ad-hoc colours.** Run `grep -rn "white/\|black/\|bg-\[#\|text-\[#" app components` before every commit; this has been violated twice.
- **Colour palette (client brief §7):** background `#0A0A0A`, main text `#FFFFFF`, off-white subtext `#D8D8D3`, grey accents `#8A8A85`. No accent colour.
- **Touch targets ≥44px.** Contact links especially — they are the page's whole purpose. Remember `min-height` is inert on inline elements; the wrapper must be block or flex.
- **Images go through Sanity's CDN**, via the custom `next/image` loader. Nothing to do differently — just don't reintroduce anything that routes through Vercel's optimizer.
- **Never commit secrets.**

## Decisions this plan locks in

1. **`/clients` reuses `LogoStrip`.** Phase 4 built a component that renders exactly what §6.5 describes for this page. A second implementation would drift from the homepage strip for no benefit.
2. **The Portable Text renderer is extracted, not duplicated.** One definition of how a link in CMS prose looks, used by both the project page and About.
3. **No contact form**, per the spec's own reasoning. Recorded here so it reads as a decision rather than an omission.
4. **The contact details live in Site Settings, not in code.** They already do — `SiteFooter` reads them — so the Contact page is a presentation of existing data.

---

### Task 1: Fix the Site Settings query, types and bio schema

**Files:**
- Modify: `sanity/lib/queries.ts`
- Modify: `sanity/lib/queries.test.ts`
- Modify: `sanity/lib/content.ts`
- Modify: `sanity/schemaTypes/siteSettings.ts`
- Modify: `sanity/schemaTypes/siteSettings.test.ts`

**Interfaces:**
- Produces: `SITE_SETTINGS_QUERY` projecting `headshot` with `IMAGE_FIELDS`; `SiteSettings.headshot: SanityImage`; `SiteSettings.bio: PortableTextValue`; a `bio` schema block restricted to the normal style plus the link annotation.

- [ ] **Step 1: Write the failing tests**

Append to `sanity/lib/queries.test.ts`:

```ts
describe('SITE_SETTINGS_QUERY headshot', () => {
  it('projects the headshot’s image fields so the About page can blur and crop it', () => {
    expect(SITE_SETTINGS_QUERY).toContain('"headshot": headshot{')
    expect(SITE_SETTINGS_QUERY).toContain('lqip')
    expect(SITE_SETTINGS_QUERY).toContain('hotspot')
  })
})
```

Append to `sanity/schemaTypes/siteSettings.test.ts`:

```ts
describe('siteSettings bio', () => {
  it('offers only the normal paragraph style, matching what the page renders', () => {
    const bio = field('bio') as unknown as {
      of?: { styles?: { value: string }[]; lists?: unknown[] }[]
    }
    expect(bio.of?.[0]?.styles?.map((s) => s.value)).toEqual(['normal'])
  })

  it('offers no list styles', () => {
    const bio = field('bio') as unknown as { of?: { lists?: unknown[] }[] }
    expect(bio.of?.[0]?.lists).toEqual([])
  })

  it('keeps the link annotation', () => {
    const bio = field('bio') as unknown as {
      of?: { marks?: { annotations?: { name: string }[] } }[]
    }
    expect(bio.of?.[0]?.marks?.annotations?.map((a) => a.name)).toContain('link')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run sanity/lib/queries.test.ts sanity/schemaTypes/siteSettings.test.ts`
Expected: FAIL — headshot is projected raw, and `bio` is the unrestricted default block.

- [ ] **Step 3: Project the headshot's image fields**

In `sanity/lib/queries.ts`, inside `SITE_SETTINGS_QUERY`, replace the bare `headshot,` line with:

```
  "headshot": headshot{
    ${IMAGE_FIELDS}
  },
```

- [ ] **Step 4: Restrict the bio block type**

In `sanity/schemaTypes/siteSettings.ts`, replace the `bio` field's `of: [{ type: 'block' }]` with the same restriction `project.description` already carries — read `sanity/schemaTypes/project.ts`'s `description` field and mirror it, so both fields behave identically:

```ts
      of: [
        {
          type: 'block',
          styles: [{ title: 'Normal', value: 'normal' }],
          lists: [],
          marks: {
            decorators: [
              { title: 'Strong', value: 'strong' },
              { title: 'Emphasis', value: 'em' },
            ],
            annotations: [
              {
                type: 'object',
                name: 'link',
                fields: [
                  defineField({
                    type: 'url',
                    name: 'href',
                    title: 'URL',
                    validation: (Rule) => Rule.required(),
                  }),
                ],
              },
            ],
          },
        },
      ],
```

Add a brief comment explaining why, matching the one on `project.description`.

- [ ] **Step 5: Fix the types**

In `sanity/lib/content.ts`, in the `SiteSettings` type, change `headshot?: unknown` to `headshot?: SanityImage` and `bio?: unknown` to `bio?: PortableTextValue`.

- [ ] **Step 6: Run the tests and the type check**

Run: `npm test && npx tsc --noEmit`
Expected: all PASS, no TypeScript errors. If any existing consumer of `headshot`/`bio` breaks, fix it — but there should be none, since nothing renders them yet.

- [ ] **Step 7: Commit**

```bash
git add sanity/
git commit -m "Project and type the headshot and bio for the About page"
```

---

### Task 2: Extract the shared Portable Text renderer

**Files:**
- Create: `components/prose.tsx`
- Create: `components/prose.test.tsx`
- Modify: `app/work/[slug]/page.tsx`

**Interfaces:**
- Produces: `<Prose value={PortableTextValue} />` — CMS prose rendered at the `--measure` reading width with consistent link styling.
- Consumes: `PortableTextValue` (Phase 3).

Phase 3 defined a `PortableTextComponents` map inline in the project page. About needs the same link treatment, so it moves into a shared component rather than being copied.

- [ ] **Step 1: Write the failing test**

Create `components/prose.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Prose } from './prose'
import type { PortableTextValue } from '@/sanity/lib/content'

const paragraph: PortableTextValue = [
  {
    _type: 'block',
    _key: 'a',
    style: 'normal',
    children: [{ _type: 'span', _key: 'a1', text: 'Shot over three nights.', marks: [] }],
  },
] as unknown as PortableTextValue

const withLink: PortableTextValue = [
  {
    _type: 'block',
    _key: 'b',
    style: 'normal',
    markDefs: [{ _key: 'l1', _type: 'link', href: 'https://example.com' }],
    children: [{ _type: 'span', _key: 'b1', text: 'See the film', marks: ['l1'] }],
  },
] as unknown as PortableTextValue

describe('Prose', () => {
  it('renders the client’s paragraphs', () => {
    render(<Prose value={paragraph} />)
    expect(screen.getByText('Shot over three nights.')).toBeInTheDocument()
  })

  it('renders a link the client wrote, and makes it visibly a link', () => {
    render(<Prose value={withLink} />)
    const link = screen.getByRole('link', { name: 'See the film' })
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link.className).toContain('underline')
  })

  it('opens outbound links safely', () => {
    render(<Prose value={withLink} />)
    const link = screen.getByRole('link', { name: 'See the film' })
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('renders nothing when there is no prose', () => {
    const { container } = render(<Prose value={undefined} />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/prose.test.tsx`
Expected: FAIL — cannot resolve `./prose`.

- [ ] **Step 3: Implement it**

Create `components/prose.tsx`. Move the `components` map out of `app/work/[slug]/page.tsx` verbatim rather than rewriting it, so the project page's rendering does not change:

```tsx
import { PortableText, type PortableTextComponents } from '@portabletext/react'

import type { PortableTextValue } from '@/sanity/lib/content'

const components: PortableTextComponents = {
  marks: {
    link: ({ value, children }) => (
      <a
        href={value?.href}
        className="underline underline-offset-2 hover:text-ink"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
  },
}

/**
 * Prose written by the client in Studio, rendered at a comfortable reading
 * width. One definition of what a link looks like, shared by every page that
 * renders CMS prose.
 */
export function Prose({ value }: { value?: PortableTextValue }) {
  if (!value || value.length === 0) return null

  return (
    <div className="max-w-[var(--measure)] text-ink-soft [&_p]:mt-4">
      <PortableText value={value} components={components} />
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run components/prose.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Use it in the project page**

In `app/work/[slug]/page.tsx`, delete the local `descriptionComponents` map and its `PortableText`/`PortableTextComponents` imports, and replace the description block with `<Prose value={project.description} />`.

The existing wrapper at line 110 is:

```tsx
          <div className="mt-12 max-w-[var(--measure)] text-ink-soft [&_p]:mt-4">
```

`Prose` now applies `max-w-[var(--measure)] text-ink-soft [&_p]:mt-4` itself, so the wrapper keeps only its outer spacing:

```tsx
          <div className="mt-12">
```

Do not leave the classes on both — the rendered result must be identical to what shipped in Phase 3, not merely similar.

- [ ] **Step 6: Verify nothing changed for project pages**

Run: `npm test && npx tsc --noEmit`
Expected: all PASS. The project page has no unit tests of its own, so confirm by reading the diff that the markup is equivalent.

- [ ] **Step 7: Commit**

```bash
git add components/prose.tsx components/prose.test.tsx app/work/
git commit -m "Extract shared Portable Text renderer"
```

---

### Task 3: About page

**Files:**
- Create: `app/about/page.tsx`

**Interfaces:**
- Consumes: `getSiteSettings` (Phase 1), `Prose` (Task 2), `urlFor`, `hotspotPosition`.

- [ ] **Step 1: Write the page**

Create `app/about/page.tsx`:

```tsx
import Image from 'next/image'
import { Suspense } from 'react'

import { Prose } from '@/components/prose'
import { hotspotPosition } from '@/lib/card-meta'
import { getSiteSettings } from '@/sanity/lib/content'
import { urlFor } from '@/sanity/lib/image'

export async function generateMetadata() {
  const settings = await getSiteSettings().catch(() => null)
  const name = settings?.name ?? 'Amegah'
  return {
    title: `About — ${name}`,
    ...(settings?.role && { description: settings.role }),
  }
}

export default function AboutPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] animate-pulse bg-hairline" />}>
      <AboutView />
    </Suspense>
  )
}

async function AboutView() {
  const settings = await getSiteSettings().catch(() => null)
  const headshot = settings?.headshot

  return (
    <section className="px-6 py-20 md:py-28">
      <h1
        className="font-display text-ink"
        style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', lineHeight: 1.05 }}
      >
        About
      </h1>

      <div className="mt-12 flex flex-col gap-12 md:flex-row md:gap-16">
        {headshot?.asset && (
          <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-hairline md:w-2/5">
            <Image
              src={urlFor(headshot).width(1200).auto('format').url()}
              alt={settings?.name ?? 'Amegah'}
              fill
              priority
              sizes="(min-width: 768px) 40vw, 100vw"
              placeholder={headshot.lqip ? 'blur' : 'empty'}
              blurDataURL={headshot.lqip}
              style={{ objectPosition: hotspotPosition(headshot) }}
              className="object-cover"
            />
          </div>
        )}

        <div className="flex-1">
          {settings?.role && <p className="index-meta mb-6">{settings.role}</p>}
          {settings?.bio ? (
            <Prose value={settings.bio} />
          ) : (
            <p className="text-ink-muted">Biography coming soon.</p>
          )}
        </div>
      </div>
    </section>
  )
}
```

Note the empty case is a human sentence rather than a blank column — per the standing empty-dataset requirement.

- [ ] **Step 2: Verify**

Run: `npm test && npm run build`
Expected: all PASS; build succeeds; `/about` appears in the route table.

- [ ] **Step 3: Commit**

```bash
git add app/about/
git commit -m "Add About page"
```

---

### Task 4: Clients & Partners page

**Files:**
- Create: `app/clients/page.tsx`

**Interfaces:**
- Consumes: `getClients`, `getPartners` (Phase 4), `LogoStrip` (Phase 4).

- [ ] **Step 1: Write the page**

Create `app/clients/page.tsx`:

```tsx
import { Suspense } from 'react'

import { LogoStrip } from '@/components/logo-strip'
import { getClients, getPartners } from '@/sanity/lib/content'

export function generateMetadata() {
  return { title: 'Clients & Partners — Amegah' }
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] animate-pulse bg-hairline" />}>
      <ClientsView />
    </Suspense>
  )
}

async function ClientsView() {
  const [clients, partners] = await Promise.all([
    getClients().catch(() => []),
    getPartners().catch(() => []),
  ])

  const isEmpty = clients.length === 0 && partners.length === 0

  return (
    <section className="px-6 py-20 md:py-28">
      <h1
        className="font-display text-ink"
        style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', lineHeight: 1.05 }}
      >
        Clients &amp; Partners
      </h1>

      {isEmpty ? (
        <p className="mt-12 text-ink-muted">Client list coming soon.</p>
      ) : (
        <LogoStrip clients={clients} partners={partners} />
      )}
    </section>
  )
}
```

`LogoStrip` already renders the two labelled sections, the logo grids, and the outbound links §6.5 asks for, and already hides a group that has no entries. The `isEmpty` check exists only so the page says something human when both groups are empty, rather than rendering a heading over nothing.

- [ ] **Step 2: Verify**

Run: `npm test && npm run build`
Expected: all PASS; build succeeds; `/clients` in the route table.

- [ ] **Step 3: Commit**

```bash
git add app/clients/
git commit -m "Add Clients and Partners page"
```

---

### Task 5: Contact page

**Files:**
- Create: `app/contact/page.tsx`

**Interfaces:**
- Consumes: `getSiteSettings` (Phase 1).

Spec §6.5: email as large clickable display type, phone, Instagram. **No contact form** — that is the spec's explicit decision, not an omission.

- [ ] **Step 1: Write the page**

Create `app/contact/page.tsx`:

```tsx
import { Suspense } from 'react'

import { getSiteSettings } from '@/sanity/lib/content'

export async function generateMetadata() {
  const settings = await getSiteSettings().catch(() => null)
  return { title: `Contact — ${settings?.name ?? 'Amegah'}` }
}

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] animate-pulse bg-hairline" />}>
      <ContactView />
    </Suspense>
  )
}

async function ContactView() {
  const settings = await getSiteSettings().catch(() => null)
  const hasAny = Boolean(settings?.email || settings?.phone || settings?.instagramUrl)

  return (
    <section className="px-6 py-20 md:py-28">
      <h1
        className="font-display text-ink"
        style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', lineHeight: 1.05 }}
      >
        Contact
      </h1>

      {!hasAny ? (
        <p className="mt-12 text-ink-muted">Contact details coming soon.</p>
      ) : (
        <div className="mt-16 flex flex-col gap-10">
          {settings?.email && (
            <div>
              <p className="index-meta mb-3">Email</p>
              <a
                href={`mailto:${settings.email}`}
                className="font-display inline-flex min-h-11 items-center text-ink hover:text-ink-soft"
                style={{ fontSize: 'clamp(1.5rem, 5vw, 3.5rem)', lineHeight: 1.1 }}
              >
                {settings.email}
              </a>
            </div>
          )}

          {settings?.phone && (
            <div>
              <p className="index-meta mb-3">Phone</p>
              <a
                href={`tel:${settings.phone}`}
                className="font-display inline-flex min-h-11 items-center text-ink hover:text-ink-soft"
                style={{ fontSize: 'clamp(1.25rem, 3vw, 2rem)', lineHeight: 1.1 }}
              >
                {settings.phone}
              </a>
            </div>
          )}

          {settings?.instagramUrl && (
            <div>
              <p className="index-meta mb-3">Instagram</p>
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-ink-soft underline underline-offset-4 hover:text-ink"
              >
                {settings.instagramUrl.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
```

Note `inline-flex` alongside `min-h-11`: `min-height` is inert on a plain inline element, so the anchors must be flex or block for the 44px target to be real.

- [ ] **Step 2: Verify the build and the whole navigation**

Run: `npm test && npm run build`
Expected: all PASS; build succeeds; `/contact` in the route table.

Then run `npm run dev` and confirm every link in the site header now resolves — About, Clients and Contact have pointed nowhere since Phase 1, and this task is what finally makes the navigation whole. Click each from the header. Also confirm each page renders sensibly with the current dataset (Site Settings has a name and role but no email, phone or Instagram, and there are no clients or partners), i.e. you should see the "coming soon" sentences rather than empty pages. Stop the dev server.

Report concretely what you saw for each of the three routes.

- [ ] **Step 3: Check for ad-hoc colours**

Run: `grep -rn "white/\|black/\|bg-\[#\|text-\[#" app components`
Expected: no hits.

- [ ] **Step 4: Commit**

```bash
git add app/contact/
git commit -m "Add Contact page"
```

---

## Phase 5 done when

- `npm test` passes and `npm run build` succeeds on the current dataset
- `/about`, `/clients` and `/contact` all render, and every link in the site header resolves — no nav item points at a 404 for the first time since Phase 1
- Each page says something human when its content is missing, rather than rendering an empty shell
- The About bio and a project description render through one shared Portable Text component, so a link looks the same in both
- The client cannot write bio content the page has no styling for

## What Phase 5 deliberately leaves out

A contact form (spec §6.5 argues against it explicitly). Motion and page transitions, `mobileCoverImage` art direction, the `editorial` cadence's varied-height masonry, `previewLoop` hover previews, per-page OG images, the performance-budget pass and the accessibility audit — all Phase 6. The `reel` hero variant remains unverified with real video pending the human Mux credential step.
