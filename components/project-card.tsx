import Image from 'next/image'
import Link from 'next/link'

import { cadenceLayout } from '@/lib/cadence'
import { hotspotPosition, indexLabel } from '@/lib/card-meta'
import type { Cadence, ProjectCardData } from '@/sanity/lib/content'
import { urlFor } from '@/sanity/lib/image'

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

  return (
    <Link href={`/work/${project.slug}`} className="group block">
      <div className={`relative overflow-hidden bg-hairline ${layout.aspect}`}>
        {image?.asset ? (
          <Image
            src={urlFor(image).width(1600).auto('format').url()}
            alt={project.title}
            fill
            sizes={sizes ?? layout.sizes}
            placeholder={image.lqip ? 'blur' : 'empty'}
            blurDataURL={image.lqip}
            style={{ objectPosition: hotspotPosition(image) }}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        ) : null}
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
