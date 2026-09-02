import type { ProjectCardData } from '@/sanity/lib/content'

export type ProjectFilter = {
  category?: string | null
  type?: string | null
}

/**
 * Filters the already-loaded project list in the browser.
 *
 * Selecting a parent category (Events) includes everything filed under it,
 * because a visitor asking for Events means "all event work", not "work filed
 * on the parent itself". Selecting a type narrows to that exact sub-category.
 */
export function filterProjects(
  projects: ProjectCardData[],
  { category, type }: ProjectFilter,
): ProjectCardData[] {
  if (type) {
    return projects.filter((project) => project.category?.slug === type)
  }
  if (category) {
    return projects.filter(
      (project) =>
        project.category?.slug === category || project.category?.parentSlug === category,
    )
  }
  return projects
}
