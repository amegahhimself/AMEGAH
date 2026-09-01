# Amegah Portfolio — Phase 1: Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded portfolio taxonomy with a client-editable content model, and stand up the caching, design tokens, and layout shell every later phase builds on.

**Architecture:** Disciplines and categories become Sanity documents (categories self-reference for sub-categories), so the client can add whole portfolio sections without a developer. Next.js Cache Components serve a static shell, with a Sanity webhook calling `revalidateTag` so edits appear within seconds and without a redeploy. Pure logic — reference filters, taxonomy data, query builders, category trees, fluid type — is unit-tested with Vitest; async Server Components are verified visually and in later E2E phases.

**Tech Stack:** Next.js 16 (App Router, Cache Components), React 19.2, TypeScript, Tailwind CSS v4, Sanity v5 (`next-sanity` 13), Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-01-amegah-portfolio-design.md`

## Global Constraints

- **Next.js 16 conventions only.** This version has breaking changes vs. training data. Read the relevant guide under `node_modules/next/dist/docs/` before writing routing, data-fetching, or config code (see `AGENTS.md`).
- **`fetch` is NOT cached by default.** Cache explicitly with `'use cache'` + `cacheTag` + `cacheLife`. Requires `cacheComponents: true`.
- **Cache Components requires the Node.js runtime.** Never set `runtime = 'edge'`.
- **Colour tokens (brief §7):** background `#0A0A0A`, main text `#FFFFFF`, off-white subtext `#D8D8D3`, grey accents `#8A8A85`, hairlines `rgba(255,255,255,0.12)`. No accent colour.
- **Typefaces:** Fraunces (display) + Inter (UI/text), both via `next/font/google`. Both SIL OFL.
- **Disciplines and categories are never hardcoded in application code.** They are always read from Sanity. Only `scripts/seed-data.ts` may name them, and only as seed values.
- **Never commit secrets.** `.env.local` is gitignored and stays that way.
- **Body text is capped at a ~65-character measure** (brief §6, readability).
- `muxVideo` on `project` is deliberately **out of scope for Phase 1** — the Mux plugin arrives in Phase 3. Do not add a field referencing an uninstalled type.

---

### Task 1: Vitest setup and the `discipline` document type

**Files:**
- Create: `vitest.config.mts`
- Create: `sanity/schemaTypes/discipline.ts`
- Create: `sanity/schemaTypes/discipline.test.ts`
- Modify: `package.json` (add dev deps + test scripts)
- Modify: `sanity/schemaTypes/index.ts`

**Interfaces:**
- Consumes: nothing (first task)
- Produces: `discipline` — a Sanity document type with fields `title` (string), `slug` (slug), `description` (text), `coverImage` (image), `cadence` (string, one of `cinematic` | `filmstrip` | `editorial`). Later tasks reference it as `{type: 'discipline'}`.

- [ ] **Step 1: Install test dependencies**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths
```

- [ ] **Step 2: Create the Vitest config**

Create `vitest.config.mts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**'],
  },
})
```

- [ ] **Step 3: Add test scripts**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Write the failing test**

Create `sanity/schemaTypes/discipline.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { discipline } from './discipline'

type Field = { name: string; type: string; options?: { list?: unknown[] } }
const fields = () => discipline.fields as unknown as Field[]

describe('discipline schema', () => {
  it('is a document type named discipline', () => {
    expect(discipline.name).toBe('discipline')
    expect(discipline.type).toBe('document')
  })

  it('has the fields the site queries', () => {
    const names = fields().map((f) => f.name)
    expect(names).toEqual(
      expect.arrayContaining(['title', 'slug', 'description', 'coverImage', 'cadence']),
    )
  })

  it('offers exactly the three grid cadences', () => {
    const cadence = fields().find((f) => f.name === 'cadence')
    expect(cadence?.options?.list).toEqual(['cinematic', 'filmstrip', 'editorial'])
  })
})
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npx vitest run sanity/schemaTypes/discipline.test.ts`
Expected: FAIL — cannot resolve `./discipline`.

- [ ] **Step 6: Implement the schema**

Create `sanity/schemaTypes/discipline.ts`:

```ts
import { defineField, defineType } from 'sanity'

export const discipline = defineType({
  name: 'discipline',
  title: 'Discipline',
  type: 'document',
  description: 'A portfolio section, such as Director or Photographer.',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'Used in the page address, e.g. /cinematographer',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
      description: 'One line shown beneath the heading on this section’s page.',
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Represents this section on the homepage.',
    }),
    defineField({
      name: 'cadence',
      title: 'Grid Cadence',
      type: 'string',
      description:
        'Controls the rhythm of this section’s grid. Cinematic: large 16:9. Filmstrip: dense. Editorial: mixed heights.',
      options: { list: ['cinematic', 'filmstrip', 'editorial'] },
      initialValue: 'editorial',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'cadence', media: 'coverImage' },
  },
})
```

- [ ] **Step 7: Register it in the schema index**

Replace the contents of `sanity/schemaTypes/index.ts`:

```ts
import { type SchemaTypeDefinition } from 'sanity'

import { discipline } from './discipline'
import { project } from './project'
import { client } from './client'
import { partner } from './partner'
import { siteSettings } from './siteSettings'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [discipline, project, client, partner, siteSettings],
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npx vitest run sanity/schemaTypes/discipline.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 9: Commit**

```bash
git add vitest.config.mts package.json package-lock.json sanity/schemaTypes/
git commit -m "Add discipline document type and Vitest setup"
```

---

### Task 2: The `category` document type with nesting

**Files:**
- Create: `sanity/schemaTypes/category.ts`
- Create: `sanity/schemaTypes/category.test.ts`
- Modify: `sanity/schemaTypes/index.ts`

**Interfaces:**
- Consumes: `discipline` from Task 1.
- Produces: `category` — document type with `title`, `slug`, `discipline` (reference → `discipline`, required), `parent` (reference → `category`, optional). Nesting via `parent` is how Events → Corporate / Traditional Wedding / White Wedding / Parties / Funerals is modelled.

- [ ] **Step 1: Write the failing test**

Create `sanity/schemaTypes/category.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { category } from './category'

type Field = { name: string; type: string; to?: { type: string }[] }
const fields = () => category.fields as unknown as Field[]
const field = (name: string) => fields().find((f) => f.name === name)

describe('category schema', () => {
  it('is a document type named category', () => {
    expect(category.name).toBe('category')
    expect(category.type).toBe('document')
  })

  it('belongs to a discipline', () => {
    const discipline = field('discipline')
    expect(discipline?.type).toBe('reference')
    expect(discipline?.to).toEqual([{ type: 'discipline' }])
  })

  it('can nest under another category', () => {
    const parent = field('parent')
    expect(parent?.type).toBe('reference')
    expect(parent?.to).toEqual([{ type: 'category' }])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run sanity/schemaTypes/category.test.ts`
Expected: FAIL — cannot resolve `./category`.

- [ ] **Step 3: Implement the schema**

Create `sanity/schemaTypes/category.ts`:

```ts
import { defineField, defineType } from 'sanity'

export const category = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  description: 'A filter within a discipline, such as Music Videos.',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'discipline',
      title: 'Discipline',
      type: 'reference',
      to: [{ type: 'discipline' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'parent',
      title: 'Parent Category',
      type: 'reference',
      to: [{ type: 'category' }],
      description:
        'Optional. Use for sub-categories, e.g. set Events as the parent of Corporate.',
    }),
  ],
  preview: {
    select: { title: 'title', discipline: 'discipline.title', parent: 'parent.title' },
    prepare({ title, discipline, parent }) {
      return {
        title,
        subtitle: parent ? `${discipline} · ${parent}` : discipline,
      }
    },
  },
})
```

- [ ] **Step 4: Register it in the schema index**

In `sanity/schemaTypes/index.ts`, add the import and include it in `types`:

```ts
import { category } from './category'
```

```ts
export const schema: { types: SchemaTypeDefinition[] } = {
  types: [discipline, category, project, client, partner, siteSettings],
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run sanity/schemaTypes/category.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add sanity/schemaTypes/
git commit -m "Add category document type with discipline and parent references"
```

---

### Task 3: Rewrite `project` to reference the taxonomy

**Files:**
- Modify: `sanity/schemaTypes/project.ts` (full rewrite)
- Create: `sanity/schemaTypes/project.test.ts`

**Interfaces:**
- Consumes: `discipline` (Task 1), `category` (Task 2).
- Produces: `project` document type, plus exported pure function
  `categoryFilter({ document }: { document: ProjectDocument }): { filter: string; params?: { disciplineId: string } }`
  where `type ProjectDocument = { discipline?: { _ref?: string } }`. Used as the `options.filter` of the `category` reference field so editors can only pick categories belonging to the chosen discipline.

- [ ] **Step 1: Write the failing test**

Create `sanity/schemaTypes/project.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { categoryFilter, project } from './project'

type Field = { name: string; type: string; to?: { type: string }[] }
const fields = () => project.fields as unknown as Field[]
const field = (name: string) => fields().find((f) => f.name === name)

describe('project schema', () => {
  it('references the discipline taxonomy rather than a hardcoded list', () => {
    const discipline = field('discipline')
    expect(discipline?.type).toBe('reference')
    expect(discipline?.to).toEqual([{ type: 'discipline' }])
  })

  it('references the category taxonomy rather than a hardcoded list', () => {
    const category = field('category')
    expect(category?.type).toBe('reference')
    expect(category?.to).toEqual([{ type: 'category' }])
  })

  it('no longer has the special-cased eventType field', () => {
    expect(field('eventType')).toBeUndefined()
  })

  it('supports an art-directed mobile crop', () => {
    expect(field('mobileCoverImage')?.type).toBe('image')
  })
})

describe('categoryFilter', () => {
  it('offers no categories until a discipline is chosen', () => {
    expect(categoryFilter({ document: {} })).toEqual({ filter: 'false' })
  })

  it('restricts categories to the chosen discipline', () => {
    expect(categoryFilter({ document: { discipline: { _ref: 'abc123' } } })).toEqual({
      filter: 'discipline._ref == $disciplineId',
      params: { disciplineId: 'abc123' },
    })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run sanity/schemaTypes/project.test.ts`
Expected: FAIL — `categoryFilter` is not exported; discipline field is a string, not a reference.

- [ ] **Step 3: Rewrite the schema**

Replace the entire contents of `sanity/schemaTypes/project.ts`:

```ts
import { defineField, defineType } from 'sanity'

type ProjectDocument = { discipline?: { _ref?: string } }

/**
 * Restricts the category picker to categories belonging to the discipline
 * already chosen on this project, so an invalid pairing cannot be saved.
 */
export function categoryFilter({ document }: { document: ProjectDocument }) {
  const disciplineId = document?.discipline?._ref
  if (!disciplineId) {
    return { filter: 'false' }
  }
  return {
    filter: 'discipline._ref == $disciplineId',
    params: { disciplineId },
  }
}

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'discipline',
      title: 'Discipline',
      type: 'reference',
      to: [{ type: 'discipline' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
      options: { filter: categoryFilter },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'client',
      title: 'Client',
      type: 'reference',
      to: [{ type: 'client' }],
    }),
    defineField({
      name: 'partners',
      title: 'Partners',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'partner' }] }],
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'mobileCoverImage',
      title: 'Mobile Cover Image',
      type: 'image',
      options: { hotspot: true },
      description:
        'Optional. A portrait-friendly crop used on phones. Falls back to the cover image.',
    }),
    defineField({
      name: 'previewLoop',
      title: 'Preview Loop',
      type: 'file',
      options: { accept: 'video/*' },
      description: 'Optional short muted clip used for hover and hero previews.',
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', title: 'Alt text', type: 'string' }),
            defineField({ name: 'caption', title: 'Caption', type: 'string' }),
          ],
        },
      ],
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description: 'Show in the homepage featured selection.',
      initialValue: false,
    }),
    defineField({
      name: 'archived',
      title: 'Archived',
      type: 'boolean',
      description: 'Hide from the live site without deleting.',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      discipline: 'discipline.title',
      category: 'category.title',
      media: 'coverImage',
    },
    prepare({ title, discipline, category, media }) {
      return { title, subtitle: [discipline, category].filter(Boolean).join(' · '), media }
    },
  },
})
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run sanity/schemaTypes/project.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Verify the whole suite and the type-check still pass**

Run: `npm test && npx tsc --noEmit`
Expected: all tests PASS, no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add sanity/schemaTypes/
git commit -m "Reference disciplines and categories from projects"
```

---

### Task 4: Drag-and-drop ordering

**Files:**
- Modify: `sanity/schemaTypes/discipline.ts`, `category.ts`, `project.ts`, `client.ts`, `partner.ts`
- Modify: `sanity/structure.ts`
- Create: `sanity/schemaTypes/ordering.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: all document types from Tasks 1–3.
- Produces: every orderable type gains an `orderRank` field. Queries in Task 7 sort with `| order(orderRank)`.

- [ ] **Step 1: Install the ordering plugin**

Compatibility is already verified: `@sanity/orderable-document-list@2.0.23` requires `sanity: ^5 || ^6.0.0-0`, `react: ^19.2`, `styled-components: ^6.1`, and this project has Sanity 5.31.2, React 19.2.8, and styled-components 6.

```bash
npm install @sanity/orderable-document-list
```

- [ ] **Step 2: Write the failing test**

Create `sanity/schemaTypes/ordering.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { discipline } from './discipline'
import { category } from './category'
import { project } from './project'
import { client } from './client'
import { partner } from './partner'

type Field = { name: string }
const names = (t: { fields: unknown }) => (t.fields as Field[]).map((f) => f.name)

describe('orderable documents', () => {
  it.each([
    ['discipline', discipline],
    ['category', category],
    ['project', project],
    ['client', client],
    ['partner', partner],
  ])('%s can be reordered by dragging', (_label, schema) => {
    expect(names(schema)).toContain('orderRank')
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run sanity/schemaTypes/ordering.test.ts`
Expected: FAIL — `orderRank` missing on all five types.

- [ ] **Step 4: Add the ordering field to each schema**

In each of `discipline.ts`, `category.ts`, `project.ts`, `client.ts`, and `partner.ts`, add this import at the top:

```ts
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list'
```

Then in each `defineType({...})`, add the `orderings` key next to `fields`, and add the field as the **last** entry of the `fields` array. For `discipline.ts` the field entry is:

```ts
orderRankField({ type: 'discipline' }),
```

and the orderings key is:

```ts
orderings: [orderRankOrdering],
```

Repeat for the others, changing only the `type` string: `'category'`, `'project'`, `'client'`, `'partner'`.

In `client.ts` and `partner.ts`, delete the existing `order` number field — `orderRankField` replaces it.

`project.ts` needs no deletion: Task 3 already rewrote it without an `order` field and without an `orderings` array.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run sanity/schemaTypes/ordering.test.ts`
Expected: PASS (5 cases).

- [ ] **Step 6: Wire the orderable lists into the Studio**

Replace the contents of `sanity/structure.ts`:

```ts
import type { StructureResolver } from 'sanity/structure'
import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Site Settings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      S.divider(),
      orderableDocumentListDeskItem({ type: 'project', title: 'Projects', S, context }),
      S.divider(),
      orderableDocumentListDeskItem({ type: 'discipline', title: 'Disciplines', S, context }),
      orderableDocumentListDeskItem({ type: 'category', title: 'Categories', S, context }),
      S.divider(),
      orderableDocumentListDeskItem({ type: 'client', title: 'Clients', S, context }),
      orderableDocumentListDeskItem({ type: 'partner', title: 'Partners', S, context }),
    ])
```

- [ ] **Step 7: Verify the Studio loads**

Run `npm run dev`, open `http://localhost:3000/studio`, and confirm the sidebar lists Site Settings, Projects, Disciplines, Categories, Clients, Partners, with no console errors. Stop the dev server afterwards.

- [ ] **Step 8: Commit**

```bash
git add sanity/ package.json package-lock.json
git commit -m "Add drag-and-drop ordering to all content types"
```

---

### Task 5: Seed the taxonomy from the brief

**Files:**
- Create: `scripts/seed-data.ts`
- Create: `scripts/seed-data.test.ts`
- Create: `scripts/seed.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `discipline` and `category` schemas (Tasks 1–2).
- Produces: `taxonomy: SeedDiscipline[]` exported from `scripts/seed-data.ts`, where:
  ```ts
  type SeedCategory = { title: string; slug: string; children?: SeedCategory[] }
  type SeedDiscipline = {
    title: string
    slug: string
    cadence: 'cinematic' | 'filmstrip' | 'editorial'
    categories: SeedCategory[]
  }
  ```
  Document IDs are deterministic: `discipline.<disciplineSlug>` and
  `category.<disciplineSlug>.<categorySlug>`, so re-running the seed is idempotent.

- [ ] **Step 1: Write the failing test**

Create `scripts/seed-data.test.ts`. These assertions encode brief §3 — if the taxonomy ever drifts from the client's brief, this fails.

```ts
import { describe, expect, it } from 'vitest'
import { taxonomy } from './seed-data'

const bySlug = (slug: string) => taxonomy.find((d) => d.slug === slug)

describe('seed taxonomy matches the client brief', () => {
  it('has the three disciplines', () => {
    expect(taxonomy.map((d) => d.slug)).toEqual([
      'director',
      'cinematographer',
      'photographer',
    ])
  })

  it('gives Director its three categories', () => {
    expect(bySlug('director')?.categories.map((c) => c.title)).toEqual([
      'Music Videos',
      'Ads',
      'Short Films',
    ])
  })

  it('gives Cinematographer its five categories', () => {
    expect(bySlug('cinematographer')?.categories.map((c) => c.title)).toEqual([
      'Music Videos',
      'Ads',
      'Documentaries',
      'Short Films',
      'Events',
    ])
  })

  it('nests the event types under Events', () => {
    const events = bySlug('cinematographer')?.categories.find((c) => c.slug === 'events')
    expect(events?.children?.map((c) => c.title)).toEqual([
      'Corporate',
      'Traditional Wedding',
      'White Wedding',
      'Parties',
      'Funerals',
    ])
  })

  it('gives Photographer its three categories', () => {
    expect(bySlug('photographer')?.categories.map((c) => c.title)).toEqual([
      'Portraits',
      'Lifestyle',
      'Editorial',
    ])
  })

  it('assigns each discipline a grid cadence', () => {
    expect(taxonomy.map((d) => d.cadence)).toEqual([
      'cinematic',
      'filmstrip',
      'editorial',
    ])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run scripts/seed-data.test.ts`
Expected: FAIL — cannot resolve `./seed-data`.

- [ ] **Step 3: Write the seed data**

Create `scripts/seed-data.ts`:

```ts
export type SeedCategory = {
  title: string
  slug: string
  children?: SeedCategory[]
}

export type SeedDiscipline = {
  title: string
  slug: string
  cadence: 'cinematic' | 'filmstrip' | 'editorial'
  categories: SeedCategory[]
}

/**
 * The starting taxonomy from the client brief (section 3).
 *
 * This is seed data only. Once seeded, the client owns this content and edits
 * it in the Studio — never read this file from application code.
 */
export const taxonomy: SeedDiscipline[] = [
  {
    title: 'Director',
    slug: 'director',
    cadence: 'cinematic',
    categories: [
      { title: 'Music Videos', slug: 'music-videos' },
      { title: 'Ads', slug: 'ads' },
      { title: 'Short Films', slug: 'short-films' },
    ],
  },
  {
    title: 'Cinematographer',
    slug: 'cinematographer',
    cadence: 'filmstrip',
    categories: [
      { title: 'Music Videos', slug: 'music-videos' },
      { title: 'Ads', slug: 'ads' },
      { title: 'Documentaries', slug: 'documentaries' },
      { title: 'Short Films', slug: 'short-films' },
      {
        title: 'Events',
        slug: 'events',
        children: [
          { title: 'Corporate', slug: 'corporate' },
          { title: 'Traditional Wedding', slug: 'traditional-wedding' },
          { title: 'White Wedding', slug: 'white-wedding' },
          { title: 'Parties', slug: 'parties' },
          { title: 'Funerals', slug: 'funerals' },
        ],
      },
    ],
  },
  {
    title: 'Photographer',
    slug: 'photographer',
    cadence: 'editorial',
    categories: [
      { title: 'Portraits', slug: 'portraits' },
      { title: 'Lifestyle', slug: 'lifestyle' },
      { title: 'Editorial', slug: 'editorial' },
    ],
  },
]

export const disciplineId = (slug: string) => `discipline.${slug}`
export const categoryId = (disciplineSlug: string, categorySlug: string) =>
  `category.${disciplineSlug}.${categorySlug}`
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run scripts/seed-data.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Write the seed script**

Create `scripts/seed.ts`:

```ts
import { createClient } from '@sanity/client'
import {
  categoryId,
  disciplineId,
  taxonomy,
  type SeedCategory,
} from './seed-data'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const token = process.env.SANITY_API_WRITE_TOKEN

if (!projectId || !dataset || !token) {
  throw new Error(
    'Missing Sanity credentials. Run `vercel env pull` first, then run this script with `npm run seed`.',
  )
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2026-09-01',
  useCdn: false,
})

async function seed() {
  const transaction = client.transaction()

  taxonomy.forEach((discipline, disciplineIndex) => {
    transaction.createOrReplace({
      _id: disciplineId(discipline.slug),
      _type: 'discipline',
      title: discipline.title,
      slug: { _type: 'slug', current: discipline.slug },
      cadence: discipline.cadence,
      orderRank: String(disciplineIndex).padStart(4, '0'),
    })

    const addCategory = (category: SeedCategory, index: number, parentSlug?: string) => {
      transaction.createOrReplace({
        _id: categoryId(discipline.slug, category.slug),
        _type: 'category',
        title: category.title,
        slug: { _type: 'slug', current: category.slug },
        discipline: { _type: 'reference', _ref: disciplineId(discipline.slug) },
        ...(parentSlug
          ? {
              parent: {
                _type: 'reference',
                _ref: categoryId(discipline.slug, parentSlug),
              },
            }
          : {}),
        orderRank: String(index).padStart(4, '0'),
      })

      category.children?.forEach((child, childIndex) =>
        addCategory(child, childIndex, category.slug),
      )
    }

    discipline.categories.forEach((category, index) => addCategory(category, index))
  })

  await transaction.commit()

  const disciplines = taxonomy.length
  const categories = taxonomy.reduce(
    (total, d) =>
      total +
      d.categories.reduce((sum, c) => sum + 1 + (c.children?.length ?? 0), 0),
    0,
  )
  console.log(`Seeded ${disciplines} disciplines and ${categories} categories.`)
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
```

- [ ] **Step 6: Add the seed script to package.json**

In `"scripts"`, add — `--env-file` loads `.env.local`, and Node 24 runs TypeScript directly:

```json
"seed": "node --env-file=.env.local scripts/seed.ts"
```

- [ ] **Step 7: Run the seed**

Run: `npm run seed`
Expected: `Seeded 3 disciplines and 16 categories.`

If it reports missing credentials, run `vercel env pull` first.

- [ ] **Step 8: Verify in the Studio**

Run `npm run dev`, open `http://localhost:3000/studio`, and confirm:
- Disciplines lists Director, Cinematographer, Photographer
- Categories lists 16 entries, with the five event types showing `Cinematographer · Events` as their subtitle
- Creating a new Project and selecting "Photographer" offers only Portraits, Lifestyle, Editorial in the Category picker

Delete any test project you created. Stop the dev server.

- [ ] **Step 9: Commit**

```bash
git add scripts/ package.json
git commit -m "Seed disciplines and categories from the client brief"
```

---

### Task 6: Design tokens, fonts, and the fluid type scale

**Files:**
- Create: `lib/typography.ts`
- Create: `lib/typography.test.ts`
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `fluid(minPx: number, maxPx: number, minVw?: number, maxVw?: number): string` returning a CSS `clamp()` expression. CSS custom properties `--ground`, `--ink`, `--ink-soft`, `--ink-muted`, `--hairline`, exposed to Tailwind as `bg-ground`, `text-ink`, `text-ink-soft`, `text-ink-muted`, `border-hairline`. Font variables `--font-display` (Fraunces) and `--font-sans` (Inter).

- [ ] **Step 1: Write the failing test**

Create `lib/typography.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { fluid } from './typography'

describe('fluid', () => {
  it('interpolates between two sizes across the viewport', () => {
    expect(fluid(16, 32, 400, 1200)).toBe('clamp(1rem, 0.5rem + 2vw, 2rem)')
  })

  it('trims trailing zeros from the computed values', () => {
    expect(fluid(16, 32, 400, 1200)).not.toContain('0000')
  })

  it('handles a fixed size where both ends match', () => {
    expect(fluid(16, 16, 400, 1200)).toBe('clamp(1rem, 1rem + 0vw, 1rem)')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/typography.test.ts`
Expected: FAIL — cannot resolve `./typography`.

- [ ] **Step 3: Implement the helper**

Create `lib/typography.ts`:

```ts
const round = (value: number) => parseFloat(value.toFixed(4)).toString()

/**
 * Builds a CSS clamp() that scales linearly between two viewport widths.
 * Sizes are given in pixels; the output is in rem so it respects the
 * reader's browser font-size setting.
 */
export function fluid(minPx: number, maxPx: number, minVw = 360, maxVw = 1440): string {
  const slope = (maxPx - minPx) / (maxVw - minVw)
  const intercept = minPx - slope * minVw
  return `clamp(${round(minPx / 16)}rem, ${round(intercept / 16)}rem + ${round(
    slope * 100,
  )}vw, ${round(maxPx / 16)}rem)`
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/typography.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Add the design tokens**

Append to `app/globals.css` (this sits alongside the existing shadcn tokens; the names are deliberately distinct so they do not collide):

```css
:root {
  --ground: #0a0a0a;
  --ink: #ffffff;
  --ink-soft: #d8d8d3;
  --ink-muted: #8a8a85;
  --hairline: rgb(255 255 255 / 0.12);

  --measure: 65ch;
}

@theme inline {
  --color-ground: var(--ground);
  --color-ink: var(--ink);
  --color-ink-soft: var(--ink-soft);
  --color-ink-muted: var(--ink-muted);
  --color-hairline: var(--hairline);
  --font-display: var(--font-fraunces);
}

body {
  background-color: var(--ground);
  color: var(--ink);
}

/* The archival index device: 01 — Music Video — 2025 */
.index-meta {
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 6: Load the typefaces**

In `app/layout.tsx`, replace the `Geist` / `Geist_Mono` imports and their consts with:

```ts
import { Fraunces, Inter } from 'next/font/google'

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  display: 'swap',
})

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
})
```

Update the `<html>` className to `` `${fraunces.variable} ${inter.variable} h-full antialiased` `` and set the metadata:

```ts
export const metadata: Metadata = {
  title: 'Amegah — Director, Cinematographer & Photographer',
  description:
    'Selected directing, cinematography and photography work by Amegah.',
}
```

- [ ] **Step 7: Verify it builds and renders**

Run: `npm run build`
Expected: build succeeds.

Then run `npm run dev`, open `http://localhost:3000`, and confirm the page background is near-black with light text. Stop the dev server.

- [ ] **Step 8: Commit**

```bash
git add lib/ app/globals.css app/layout.tsx
git commit -m "Add design tokens, typefaces, and fluid type scale"
```

---

### Task 7: Cache Components and the Sanity data layer

**Files:**
- Modify: `next.config.ts`
- Create: `sanity/lib/queries.ts`
- Create: `sanity/lib/queries.test.ts`
- Create: `sanity/lib/tags.ts`
- Create: `sanity/lib/content.ts`

**Interfaces:**
- Consumes: schemas from Tasks 1–4.
- Produces:
  - `TAGS` — `{ discipline: 'discipline', category: 'category', project: 'project', client: 'client', partner: 'partner', siteSettings: 'siteSettings' }`
  - `isContentType(type: string): boolean`
  - `projectListQuery(options: { disciplineSlug?: string; categorySlug?: string }): string`
  - `getDisciplines(): Promise<Discipline[]>`, `getSiteSettings(): Promise<SiteSettings | null>` — cached Server-Component data functions used by Task 10 and later phases.

- [ ] **Step 1: Read the caching guide**

Read `node_modules/next/dist/docs/01-app/01-getting-started/09-revalidating.md` and `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/cacheComponents.md` before writing code. Key points: `fetch` is not cached by default; `'use cache'` + `cacheTag` + `cacheLife('max')` plus webhook revalidation is the documented pattern for CMS content.

- [ ] **Step 2: Enable Cache Components and allow the image hosts**

Replace the contents of `next.config.ts`:

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io', pathname: '/**' },
      { protocol: 'https', hostname: 'image.mux.com', pathname: '/**' },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 3: Write the failing test**

Create `sanity/lib/queries.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { projectListQuery } from './queries'

describe('projectListQuery', () => {
  it('always excludes archived projects', () => {
    expect(projectListQuery({})).toContain('!archived')
  })

  it('sorts by the editor-defined order', () => {
    expect(projectListQuery({})).toContain('order(orderRank)')
  })

  it('filters by discipline when given one', () => {
    expect(projectListQuery({ disciplineSlug: 'director' })).toContain(
      'discipline->slug.current == $disciplineSlug',
    )
  })

  it('filters by category when given one', () => {
    expect(projectListQuery({ categorySlug: 'ads' })).toContain(
      'category->slug.current == $categorySlug',
    )
  })

  it('omits the category clause when no category is given', () => {
    expect(projectListQuery({ disciplineSlug: 'director' })).not.toContain(
      '$categorySlug',
    )
  })
})
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npx vitest run sanity/lib/queries.test.ts`
Expected: FAIL — cannot resolve `./queries`.

- [ ] **Step 5: Write the queries**

Create `sanity/lib/queries.ts`:

```ts
export const PROJECT_CARD_PROJECTION = `{
  _id,
  title,
  "slug": slug.current,
  year,
  coverImage,
  mobileCoverImage,
  "discipline": discipline->{title, "slug": slug.current, cadence},
  "category": category->{title, "slug": slug.current}
}`

export function projectListQuery({
  disciplineSlug,
  categorySlug,
}: {
  disciplineSlug?: string
  categorySlug?: string
}): string {
  const clauses = ['_type == "project"', '!archived']
  if (disciplineSlug) clauses.push('discipline->slug.current == $disciplineSlug')
  if (categorySlug) clauses.push('category->slug.current == $categorySlug')
  return `*[${clauses.join(' && ')}] | order(orderRank) ${PROJECT_CARD_PROJECTION}`
}

export const DISCIPLINES_QUERY = `*[_type == "discipline"] | order(orderRank) {
  _id,
  title,
  "slug": slug.current,
  description,
  coverImage,
  cadence
}`

export const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0] {
  name,
  headshot,
  bio,
  phone,
  email,
  instagramUrl
}`
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run sanity/lib/queries.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 7: Define the cache tags**

Create `sanity/lib/tags.ts`:

```ts
export const TAGS = {
  discipline: 'discipline',
  category: 'category',
  project: 'project',
  client: 'client',
  partner: 'partner',
  siteSettings: 'siteSettings',
} as const

export type ContentType = keyof typeof TAGS

export function isContentType(type: string): type is ContentType {
  return Object.hasOwn(TAGS, type)
}
```

- [ ] **Step 8: Write the cached data functions**

Create `sanity/lib/content.ts`:

```ts
import { cacheLife, cacheTag } from 'next/cache'

import { client } from './client'
import { DISCIPLINES_QUERY, SITE_SETTINGS_QUERY } from './queries'
import { TAGS } from './tags'

export type Discipline = {
  _id: string
  title: string
  slug: string
  description?: string
  coverImage?: unknown
  cadence: 'cinematic' | 'filmstrip' | 'editorial'
}

export type SiteSettings = {
  name: string
  headshot?: unknown
  bio?: unknown
  phone?: string
  email?: string
  instagramUrl?: string
}

export async function getDisciplines(): Promise<Discipline[]> {
  'use cache'
  cacheTag(TAGS.discipline)
  cacheLife('max')
  return client.fetch<Discipline[]>(DISCIPLINES_QUERY)
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  'use cache'
  cacheTag(TAGS.siteSettings)
  cacheLife('max')
  return client.fetch<SiteSettings | null>(SITE_SETTINGS_QUERY)
}
```

- [ ] **Step 9: Verify the build and full suite**

Run: `npm test && npm run build`
Expected: all tests PASS; build succeeds with Cache Components enabled.

- [ ] **Step 10: Commit**

```bash
git add next.config.ts sanity/lib/
git commit -m "Enable Cache Components and add the cached Sanity data layer"
```

---

### Task 8: Revalidation webhook

**Files:**
- Create: `app/api/revalidate/route.ts`
- Create: `app/api/revalidate/tags.ts`
- Create: `app/api/revalidate/tags.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `TAGS` and `isContentType` from Task 7.
- Produces: `tagsForPayload(body: unknown): string[]` — maps a Sanity webhook payload to the cache tags to revalidate. `POST /api/revalidate` verifies the signature and revalidates.

- [ ] **Step 1: Install the webhook helper**

```bash
npm install @sanity/webhook
```

- [ ] **Step 2: Write the failing test**

Create `app/api/revalidate/tags.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { tagsForPayload } from './tags'

describe('tagsForPayload', () => {
  it('revalidates the matching tag for a known document type', () => {
    expect(tagsForPayload({ _type: 'project' })).toEqual(['project'])
  })

  it('revalidates settings when the singleton changes', () => {
    expect(tagsForPayload({ _type: 'siteSettings' })).toEqual(['siteSettings'])
  })

  it('ignores document types the site does not render', () => {
    expect(tagsForPayload({ _type: 'sanity.imageAsset' })).toEqual([])
  })

  it('ignores a payload with no type', () => {
    expect(tagsForPayload({})).toEqual([])
    expect(tagsForPayload(null)).toEqual([])
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run app/api/revalidate/tags.test.ts`
Expected: FAIL — cannot resolve `./tags`.

- [ ] **Step 4: Implement the mapping**

Create `app/api/revalidate/tags.ts`:

```ts
import { isContentType, TAGS } from '@/sanity/lib/tags'

/**
 * Maps a Sanity webhook payload to the cache tags that should be revalidated.
 * Unknown document types (asset records, drafts of internal types) map to
 * nothing, so an unexpected payload can never blow away the whole cache.
 */
export function tagsForPayload(body: unknown): string[] {
  const type = (body as { _type?: unknown } | null)?._type
  if (typeof type !== 'string' || !isContentType(type)) {
    return []
  }
  return [TAGS[type]]
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run app/api/revalidate/tags.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Write the route handler**

Create `app/api/revalidate/route.ts`:

```ts
import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook'
import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

import { tagsForPayload } from './tags'

export async function POST(request: Request) {
  const secret = process.env.SANITY_REVALIDATE_SECRET
  if (!secret) {
    return NextResponse.json(
      { message: 'Revalidation secret is not configured' },
      { status: 500 },
    )
  }

  const signature = request.headers.get(SIGNATURE_HEADER_NAME)
  const body = await request.text()

  if (!signature || !(await isValidSignature(body, signature, secret))) {
    return NextResponse.json({ message: 'Invalid signature' }, { status: 401 })
  }

  const tags = tagsForPayload(JSON.parse(body))
  tags.forEach((tag) => revalidateTag(tag, 'max'))

  return NextResponse.json({ revalidated: tags })
}
```

- [ ] **Step 7: Add the secret**

Generate a secret and add it to Vercel for all environments, then pull it locally:

```bash
openssl rand -base64 32
vercel env add SANITY_REVALIDATE_SECRET
vercel env pull
```

- [ ] **Step 8: Verify the handler rejects unsigned requests**

Run `npm run dev`, then:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/revalidate -d '{"_type":"project"}'
```

Expected: `401`. Stop the dev server.

- [ ] **Step 9: Commit**

```bash
git add app/api/ package.json package-lock.json
git commit -m "Add signed Sanity revalidation webhook"
```

> **Deferred to deployment:** creating the webhook in Sanity (`sanity.io/manage` → API → Webhooks) pointed at `https://<production-domain>/api/revalidate` with the same secret. Record this in the handover notes.

---

### Task 9: Category tree helper

**Files:**
- Create: `lib/categories.ts`
- Create: `lib/categories.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```ts
  type FlatCategory = { _id: string; title: string; slug: string; parentId: string | null }
  type CategoryNode = FlatCategory & { children: CategoryNode[] }
  function buildCategoryTree(categories: FlatCategory[]): CategoryNode[]
  ```
  Phase 2's filter bar renders top-level pills from the returned roots and a second row from a selected root's `children`.

- [ ] **Step 1: Write the failing test**

Create `lib/categories.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildCategoryTree, type FlatCategory } from './categories'

const cat = (id: string, slug: string, parentId: string | null = null): FlatCategory => ({
  _id: id,
  title: slug,
  slug,
  parentId,
})

describe('buildCategoryTree', () => {
  it('returns top-level categories as roots', () => {
    const tree = buildCategoryTree([cat('1', 'ads'), cat('2', 'events')])
    expect(tree.map((n) => n.slug)).toEqual(['ads', 'events'])
    expect(tree.every((n) => n.children.length === 0)).toBe(true)
  })

  it('nests children under their parent', () => {
    const tree = buildCategoryTree([
      cat('1', 'events'),
      cat('2', 'corporate', '1'),
      cat('3', 'funerals', '1'),
    ])
    expect(tree).toHaveLength(1)
    expect(tree[0].children.map((c) => c.slug)).toEqual(['corporate', 'funerals'])
  })

  it('preserves the incoming order', () => {
    const tree = buildCategoryTree([cat('2', 'events'), cat('1', 'ads')])
    expect(tree.map((n) => n.slug)).toEqual(['events', 'ads'])
  })

  it('treats a child whose parent is missing as a root', () => {
    const tree = buildCategoryTree([cat('2', 'corporate', 'missing')])
    expect(tree.map((n) => n.slug)).toEqual(['corporate'])
  })

  it('returns an empty array for no categories', () => {
    expect(buildCategoryTree([])).toEqual([])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/categories.test.ts`
Expected: FAIL — cannot resolve `./categories`.

- [ ] **Step 3: Implement the helper**

Create `lib/categories.ts`:

```ts
export type FlatCategory = {
  _id: string
  title: string
  slug: string
  parentId: string | null
}

export type CategoryNode = FlatCategory & { children: CategoryNode[] }

/**
 * Turns the flat category list from Sanity into a one-level-deep tree.
 * A category whose parent is not in the list is treated as a root, so a
 * half-published taxonomy still renders something usable.
 */
export function buildCategoryTree(categories: FlatCategory[]): CategoryNode[] {
  const nodes = new Map<string, CategoryNode>(
    categories.map((category) => [category._id, { ...category, children: [] }]),
  )

  const roots: CategoryNode[] = []

  for (const category of categories) {
    const node = nodes.get(category._id)!
    const parent = category.parentId ? nodes.get(category.parentId) : undefined
    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/categories.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/categories.ts lib/categories.test.ts
git commit -m "Add category tree helper for the filter bar"
```

---

### Task 10: Layout shell — navigation and footer

**Files:**
- Create: `components/site-header.tsx`
- Create: `components/site-header.test.tsx`
- Create: `components/site-footer.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `getDisciplines`, `getSiteSettings` (Task 7); design tokens (Task 6).
- Produces: `<SiteHeader disciplines={...} />` — a Client Component taking `{ disciplines: { title: string; slug: string }[] }`, rendering discipline links plus About / Clients / Contact, with a mobile overlay menu. `<SiteFooter settings={...} />` renders contact details and the Instagram link.

- [ ] **Step 1: Write the failing test**

Create `components/site-header.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SiteHeader } from './site-header'

const disciplines = [
  { title: 'Director', slug: 'director' },
  { title: 'Cinematographer', slug: 'cinematographer' },
]

describe('SiteHeader', () => {
  it('links to each discipline from the CMS', () => {
    render(<SiteHeader disciplines={disciplines} />)
    expect(screen.getByRole('link', { name: 'Director' })).toHaveAttribute(
      'href',
      '/director',
    )
    expect(screen.getByRole('link', { name: 'Cinematographer' })).toHaveAttribute(
      'href',
      '/cinematographer',
    )
  })

  it('always offers the standing pages', () => {
    render(<SiteHeader disciplines={disciplines} />)
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'Clients' })).toHaveAttribute('href', '/clients')
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact')
  })

  it('renders nothing discipline-shaped when the CMS is empty', () => {
    render(<SiteHeader disciplines={[]} />)
    expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument()
  })

  it('exposes a labelled menu toggle for small screens', () => {
    render(<SiteHeader disciplines={disciplines} />)
    expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Add the DOM matchers**

```bash
npm install -D @testing-library/jest-dom
```

Create `vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

Add `setupFiles` to `vitest.config.mts`'s `test` block:

```ts
    setupFiles: ['./vitest.setup.ts'],
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run components/site-header.test.tsx`
Expected: FAIL — cannot resolve `./site-header`.

- [ ] **Step 4: Implement the header**

Create `components/site-header.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'

type NavDiscipline = { title: string; slug: string }

const STANDING_LINKS = [
  { title: 'About', href: '/about' },
  { title: 'Clients', href: '/clients' },
  { title: 'Contact', href: '/contact' },
]

export function SiteHeader({ disciplines }: { disciplines: NavDiscipline[] }) {
  const [open, setOpen] = useState(false)

  const links = [
    ...disciplines.map((d) => ({ title: d.title, href: `/${d.slug}` })),
    ...STANDING_LINKS,
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-ground/80 backdrop-blur">
      <div className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="font-display text-lg tracking-tight text-ink">
          Amegah
        </Link>

        <nav className="hidden gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="index-meta transition-colors hover:text-ink"
            >
              {link.title}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="index-meta md:hidden"
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-6 px-6 pb-10 pt-4 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="font-display text-3xl text-ink"
            >
              {link.title}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
```

Note: the mobile links duplicate the desktop ones by design — the test queries by accessible name, so keep exactly one visible set per breakpoint via the `hidden md:flex` / `md:hidden` pairing.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run components/site-header.test.tsx`
Expected: PASS (4 tests).

If "found multiple elements" errors appear, the mobile menu is open during the test — it starts closed, so check the `open &&` guard.

- [ ] **Step 6: Implement the footer**

Create `components/site-footer.tsx`:

```tsx
import type { SiteSettings } from '@/sanity/lib/content'

export function SiteFooter({ settings }: { settings: SiteSettings | null }) {
  return (
    <footer className="mt-32 border-t border-hairline px-6 py-16">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <p className="font-display text-ink" style={{ fontSize: 'clamp(2rem, 6vw, 4rem)' }}>
          Get in touch
        </p>

        <div className="flex flex-col gap-2">
          {settings?.email && (
            <a href={`mailto:${settings.email}`} className="text-ink-soft hover:text-ink">
              {settings.email}
            </a>
          )}
          {settings?.phone && (
            <a href={`tel:${settings.phone}`} className="text-ink-soft hover:text-ink">
              {settings.phone}
            </a>
          )}
          {settings?.instagramUrl && (
            <a
              href={settings.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="index-meta hover:text-ink"
            >
              Instagram
            </a>
          )}
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 7: Wire the shell into the root layout**

In `app/layout.tsx`, import the components and the data functions, make `RootLayout` async, and wrap `children`:

```tsx
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { getDisciplines, getSiteSettings } from '@/sanity/lib/content'
```

```tsx
export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const [disciplines, settings] = await Promise.all([
    getDisciplines(),
    getSiteSettings(),
  ])

  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader
          disciplines={disciplines.map((d) => ({ title: d.title, slug: d.slug }))}
        />
        <main className="flex-1">{children}</main>
        <SiteFooter settings={settings} />
      </body>
    </html>
  )
}
```

The Studio route at `/studio` renders inside this layout. Confirm in Step 9 that it still loads; if the header overlaps it, that is fixed in Phase 6 by moving the marketing pages into a route group — do not restructure routes in this task.

- [ ] **Step 8: Replace the starter homepage**

Replace the contents of `app/page.tsx`:

```tsx
export default function Home() {
  return (
    <section className="px-6 py-32">
      <h1
        className="font-display text-ink"
        style={{ fontSize: 'clamp(2.5rem, 10vw, 8rem)', lineHeight: 1.02 }}
      >
        Amegah
      </h1>
      <p className="index-meta mt-6">Director · Cinematographer · Photographer</p>
    </section>
  )
}
```

- [ ] **Step 9: Verify end to end**

Run: `npm test && npm run build`
Expected: all tests PASS; build succeeds.

Run `npm run dev` and confirm:
- `http://localhost:3000` shows the name in Fraunces on near-black, with the seeded disciplines in the nav
- narrowing the window below 768px swaps the nav for the Menu toggle, which opens and closes
- `http://localhost:3000/studio` still loads

Stop the dev server.

- [ ] **Step 10: Commit and push**

```bash
git add components/ app/ vitest.config.mts vitest.setup.ts package.json package-lock.json
git commit -m "Add site header, footer, and layout shell"
git push
```

---

## Phase 1 done when

- `npm test` passes and `npm run build` succeeds
- The Studio lists Projects, Disciplines, Categories, Clients, Partners, Site Settings, all drag-reorderable
- Creating a project offers only the categories belonging to the chosen discipline
- Adding a new discipline in the Studio makes it appear in the site navigation without a code change — this is the requirement that motivated the whole phase (brief §2, criteria #4 and #8)
- The homepage renders on near-black in Fraunces, responsive from 360px up

## What Phase 1 deliberately leaves out

Mux and the `muxVideo` field (Phase 3), the filter bar UI (Phase 2), grid cadence rendering (Phase 2), project pages (Phase 3), the three hero variants (Phase 4), About / Clients / Contact pages (Phase 5), motion and OG images (Phase 6).
