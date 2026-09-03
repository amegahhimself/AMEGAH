import { notFound } from 'next/navigation'
import { Suspense, type ReactNode } from 'react'

import { WorkBrowser } from '@/components/work-browser'
import { buildCategoryTree } from '@/lib/categories'
import {
  getCategoriesForDiscipline,
  getDisciplineBySlug,
  getProjectsForDiscipline,
} from '@/sanity/lib/content'
import { urlFor } from '@/sanity/lib/image'

// No generateStaticParams: disciplines are client-creatable and
// client-deletable, so this route's params must not depend on content
// existing at build time — an empty dataset would hard-error the build under
// Cache Components. Params are runtime data instead; the grid below already
// streams at request time (it reads searchParams), so the prerendered
// portion was only ever the heading, description and project count.

export async function generateMetadata({ params }: PageProps<'/[discipline]'>) {
  const { discipline: slug } = await params
  const discipline = await getDisciplineBySlug(slug)
  if (!discipline) return {}

  const title = `${discipline.title} — Amegah`
  const ogImage = discipline.coverImage?.asset
    ? urlFor(discipline.coverImage).width(1200).height(630).auto('format').url()
    : undefined

  return {
    title,
    // Next 16 merges metadata with `metadata[key] ?? null`, so an explicit
    // `description: undefined` becomes `null` and overwrites (rather than
    // inherits) the root layout's description
    // (node_modules/next/dist/lib/metadata/resolve-metadata.js). Omitting
    // the key entirely when there's no value lets inheritance work.
    ...(discipline.description && { description: discipline.description }),
    openGraph: {
      title,
      ...(discipline.description && { description: discipline.description }),
      type: 'article',
      // Same trap applies to `images`: an explicit `undefined` overwrites
      // rather than inherits, so omit the key entirely when there's no
      // cover image instead of passing `undefined`.
      ...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630 }] }),
    },
  }
}

const first = (value: string | string[] | undefined): string | null =>
  (Array.isArray(value) ? value[0] : value) ?? null

export default function DisciplinePage({ params, searchParams }: PageProps<'/[discipline]'>) {
  return (
    <Suspense fallback={<DisciplineFallback />}>
      <DisciplineHeader params={params}>
        <Suspense fallback={<WorkBrowserFallback />}>
          <DisciplineWork params={params} searchParams={searchParams} />
        </Suspense>
      </DisciplineHeader>
    </Suspense>
  )
}

function DisciplineFallback() {
  return (
    <section className="px-6 py-24">
      <div className="h-12 w-64 animate-pulse bg-hairline" />
    </section>
  )
}

function WorkBrowserFallback() {
  return <div className="mt-12 h-96 animate-pulse bg-hairline" />
}

async function DisciplineHeader({
  params,
  children,
}: Pick<PageProps<'/[discipline]'>, 'params'> & { children: ReactNode }) {
  const { discipline: slug } = await params
  const discipline = await getDisciplineBySlug(slug)

  if (!discipline) {
    notFound()
  }

  const projects = await getProjectsForDiscipline(slug)

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

      {children}
    </section>
  )
}

async function DisciplineWork({
  params,
  searchParams,
}: Pick<PageProps<'/[discipline]'>, 'params' | 'searchParams'>) {
  const { discipline: slug } = await params
  const [discipline, flatCategories, projects, query] = await Promise.all([
    getDisciplineBySlug(slug),
    getCategoriesForDiscipline(slug),
    getProjectsForDiscipline(slug),
    searchParams,
  ])

  if (!discipline) {
    notFound()
  }

  const categories = buildCategoryTree(flatCategories)

  return (
    <WorkBrowser
      projects={projects}
      categories={categories}
      cadence={discipline.cadence}
      initialCategory={first(query.category)}
      initialType={first(query.type)}
    />
  )
}
