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
