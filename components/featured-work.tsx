import type { ProjectCardData } from '@/sanity/lib/content'
import { Reveal } from './reveal'
import { SelectedWorkCard } from './selected-work-card'

export function FeaturedWork({ projects }: { projects: ProjectCardData[] }) {
  if (projects.length === 0) return null

  return (
    <section id="work" className="bg-ground-alt px-6 py-24 md:py-32">
      <div className="mb-6 flex items-center gap-3">
        <span className="h-px w-6 bg-accent" aria-hidden="true" />
        <span className="index-meta">Portfolio</span>
      </div>

      <h2 className="mb-14 text-4xl font-bold uppercase leading-[0.9] text-ink md:text-6xl">
        Selected Work
      </h2>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:gap-10 lg:grid-cols-3">
        {projects.map((project, index) => (
          <Reveal key={project._id}>
            <SelectedWorkCard
              project={project}
              priority={index === 0}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
          </Reveal>
        ))}
      </div>
    </section>
  )
}
