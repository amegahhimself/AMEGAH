import { cn } from '@/lib/utils'
import { posterUrl } from '@/lib/video-poster'
import type { ProjectDetail } from '@/sanity/lib/content'
import { CoverImage, coverFrameProps } from './cover-image'
import { ProjectVideo } from './project-video'

/** The hero's shape when nothing art-directs it — the numeric twin of
 *  `aspect-video`. */
const HERO_RATIO = 16 / 9

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

  // A phone gets the client's own portrait crop, in its own shape — a 16:9
  // hero is the worst possible box for a portrait photograph.
  const frame = coverFrameProps({
    mobileImage: project.mobileCoverImage,
    desktopRatio: HERO_RATIO,
  })

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden bg-hairline',
        frame?.className ?? 'aspect-video',
      )}
      style={frame?.style}
    >
      <CoverImage
        image={project.coverImage}
        mobileImage={project.mobileCoverImage}
        alt={project.title}
        sizes="100vw"
        priority
      />
    </div>
  )
}
