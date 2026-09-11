import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { ProjectGallery } from '@/components/project-gallery'
import { ProjectHero } from '@/components/project-hero'
import { Prose, hasProse } from '@/components/prose'
import { adjacentProjects } from '@/lib/adjacent-projects'
import { creditLine } from '@/lib/credits'
import { getDisciplineProjectRefs, getProjectBySlug } from '@/sanity/lib/content'
import { urlFor } from '@/sanity/lib/image'
import { SITE_URL } from '@/lib/site-url'

// No generateStaticParams: this route's params come from CMS content, and a
// CMS-driven route must not depend on content existing at build time — an
// empty dataset would hard-error the build under Cache Components. Params are
// runtime data instead; the <Suspense> boundary below supplies the static shell.

export async function generateMetadata({ params }: PageProps<'/work/[slug]'>) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) return {}

  const title = `${project.title} — Amegah`
  const description = creditLine(project)
  const ogImage = project.coverImage?.asset
    ? urlFor(project.coverImage).width(1200).height(630).auto('format').url()
    : undefined

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/work/${slug}` },
    openGraph: {
      title,
      description,
      type: 'article',
      // Next 16 merges metadata with `metadata[key] ?? null`, so an explicit
      // `images: undefined` becomes `null` and overwrites (rather than
      // inherits) the parent's images
      // (node_modules/next/dist/lib/metadata/resolve-metadata.js). Omitting
      // the key entirely when there's no cover image lets inheritance work.
      ...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630 }] }),
    },
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

  if (!project || !project.discipline) {
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
          className="mt-3 font-bold text-ink"
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

        {hasProse(project.description) ? (
          <div className="mt-12">
            <Prose value={project.description} />
          </div>
        ) : null}

        <ProjectGallery images={project.gallery ?? []} title={project.title} />

        <nav className="mt-32 flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-8">
          {prev ? (
            <Link
              href={`/work/${prev.slug}`}
              className="index-meta inline-flex min-h-11 items-center border border-hairline px-5 transition-colors hover:border-ink-soft hover:text-ink"
            >
              ← {prev.title}
            </Link>
          ) : (
            <span />
          )}
          <Link
            href={`/${project.discipline.slug}`}
            className="index-meta inline-flex min-h-11 items-center border border-accent px-5 !text-accent transition-colors hover:bg-accent hover:!text-accent-ink"
          >
            All {project.discipline.title}
          </Link>
          {next ? (
            <Link
              href={`/work/${next.slug}`}
              className="index-meta inline-flex min-h-11 items-center border border-hairline px-5 transition-colors hover:border-ink-soft hover:text-ink"
            >
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
