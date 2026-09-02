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
      <div className="relative aspect-video w-full bg-hairline">
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
