import { featuredSpan } from '@/lib/featured-layout'
import type { ProjectCardData } from '@/sanity/lib/content'
import { ProjectCard } from './project-card'

export function FeaturedWork({ projects }: { projects: ProjectCardData[] }) {
  if (projects.length === 0) return null

  return (
    <section className="px-6 py-24 md:py-32">
      <h2 className="index-meta mb-12">Selected work</h2>
      <div className="grid grid-cols-1 gap-x-6 gap-y-20 md:grid-cols-2">
        {projects.map((project, index) => {
          const span = featuredSpan(index)
          return (
            <div key={project._id} className={span === 'full' ? 'md:col-span-2' : undefined}>
              <ProjectCard
                project={project}
                index={index}
                cadence={span === 'full' ? 'cinematic' : 'editorial'}
                sizes={span === 'full' ? '100vw' : '(min-width: 768px) 50vw, 100vw'}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
