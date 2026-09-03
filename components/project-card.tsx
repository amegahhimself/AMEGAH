import Link from 'next/link'

import { cadenceLayout } from '@/lib/cadence'
import { indexLabel } from '@/lib/card-meta'
import type { Cadence, ProjectCardData } from '@/sanity/lib/content'
import { CoverImage } from './cover-image'

export function ProjectCard({
  project,
  index,
  cadence,
  sizes,
}: {
  project: ProjectCardData
  index: number
  cadence: Cadence
  /** Overrides the cadence's default `sizes` when the card sits in a grid
   *  whose column widths differ from that discipline's own grid. */
  sizes?: string
}) {
  const layout = cadenceLayout(cadence)
  const image = project.coverImage

  // When the cadence pins no aspect (editorial), take the shape of the
  // photograph itself (spec 6.3: "mixed portrait/landscape, varied
  // heights"). An image with no aspectRatio in its metadata falls back to
  // aspect-[4/5] so the card can never collapse to zero height.
  const ratio = layout.aspect ? undefined : image?.aspectRatio

  return (
    <Link href={`/work/${project.slug}`} className="group block">
      <div
        className={`relative overflow-hidden bg-hairline ${layout.aspect ?? (ratio ? '' : 'aspect-[4/5]')}`}
        style={ratio ? { aspectRatio: String(ratio) } : undefined}
      >
        <CoverImage
          image={image}
          mobileImage={project.mobileCoverImage}
          alt={project.title}
          sizes={sizes ?? layout.sizes}
          className="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
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
