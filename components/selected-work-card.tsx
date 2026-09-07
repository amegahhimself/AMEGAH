import { Eye } from 'lucide-react'
import Link from 'next/link'

import type { ProjectCardData } from '@/sanity/lib/content'
import { CoverImage } from './cover-image'

/**
 * A single tile in the homepage's "Selected Works" grid.
 *
 * Deliberately its own component rather than a variant of ProjectCard: this
 * grid uses a uniform aspect ratio and a title/category row instead of
 * ProjectCard's archival index-label treatment, which discipline pages still
 * rely on. Changing that shared component's layout would have moved those
 * pages too.
 */
export function SelectedWorkCard({
  project,
  sizes,
  priority,
}: {
  project: ProjectCardData
  sizes?: string
  priority?: boolean
}) {
  return (
    <Link href={`/work/${project.slug}`} className="group block">
      <div className="relative aspect-[3/2] overflow-hidden bg-hairline">
        <CoverImage
          image={project.coverImage}
          mobileImage={project.mobileCoverImage}
          alt={project.title}
          sizes={sizes}
          priority={priority}
          className="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ground/0 transition-colors duration-300 group-hover:bg-ground/30">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink/40 bg-ground/70 px-5 py-2.5 text-xs tracking-[0.14em] text-ink uppercase opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
            <Eye className="size-3.5" aria-hidden="true" />
            View Project
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-4">
        {/*
          min-w-0 is load-bearing: a flex child's default min-width is
          `auto` (its content's natural width), so without this, `truncate`
          never actually engages — the title just overflows past its
          column's edge instead of clipping. A real bug that shipped once
          already: title and category rows from neighbouring cards ran
          together on one visual line.
        */}
        <h3 className="min-w-0 truncate text-base font-bold uppercase text-ink md:text-lg">
          {project.title}
        </h3>
        {project.category && (
          <span className="index-meta shrink-0 normal-case">{project.category.title}</span>
        )}
      </div>
    </Link>
  )
}
