import { posterUrl } from '@/lib/video-poster'
import type { ProjectDetail } from '@/sanity/lib/content'
import { CoverImage } from './cover-image'
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
      {/* No `mobileImage` yet: PROJECT_DETAIL_QUERY doesn't project
          `mobileCoverImage` and `ProjectDetail` doesn't type it, unlike the
          card projection. Adding both is a one-line change each, and this
          hero then art-directs on phones for free. */}
      <CoverImage image={project.coverImage} alt={project.title} sizes="100vw" priority />
    </div>
  )
}
