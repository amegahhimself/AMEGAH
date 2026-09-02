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
