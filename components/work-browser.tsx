'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

import { cadenceLayout } from '@/lib/cadence'
import type { CategoryNode } from '@/lib/categories'
import { buildFilterQuery } from '@/lib/filter-query'
import { filterProjects } from '@/lib/filter-projects'
import type { Cadence, ProjectCardData } from '@/sanity/lib/content'
import { CategoryFilterBar, type FilterChange } from './category-filter-bar'
import { ProjectCard } from './project-card'

export function WorkBrowser({
  projects,
  categories,
  cadence,
  initialCategory,
  initialType,
  pageSize = 12,
}: {
  projects: ProjectCardData[]
  categories: CategoryNode[]
  cadence: Cadence
  initialCategory: string | null
  initialType: string | null
  pageSize?: number
}) {
  const router = useRouter()
  const pathname = usePathname()

  const [filter, setFilter] = useState<FilterChange>({
    category: initialCategory,
    type: initialType,
  })
  const [visible, setVisible] = useState(pageSize)

  const layout = cadenceLayout(cadence)
  const filtered = useMemo(() => filterProjects(projects, filter), [projects, filter])
  const shown = filtered.slice(0, visible)

  function apply(next: FilterChange) {
    setFilter(next)
    setVisible(pageSize)
    router.replace(`${pathname}${buildFilterQuery(next)}`, { scroll: false })
  }

  return (
    <div>
      <CategoryFilterBar
        categories={categories}
        activeCategory={filter.category}
        activeType={filter.type}
        onChange={apply}
      />

      {filtered.length === 0 ? (
        <p className="index-meta py-24 text-center">No projects in this category yet.</p>
      ) : (
        <div className={`mt-12 ${layout.grid}`}>
          {shown.map((project, index) => (
            <ProjectCard
              key={project._id}
              project={project}
              index={index}
              cadence={cadence}
            />
          ))}
        </div>
      )}

      {visible < filtered.length && (
        <div className="mt-20 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((count) => count + pageSize)}
            className="index-meta min-h-11 border border-hairline px-8 transition-colors hover:text-ink"
          >
            Load more ({filtered.length - visible})
          </button>
        </div>
      )}
    </div>
  )
}
