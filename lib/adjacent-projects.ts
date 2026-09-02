import type { ProjectRef } from '@/sanity/lib/content'

/**
 * Finds the projects either side of the current one, in the editor's order.
 *
 * The list deliberately does not wrap: at the ends, one side is simply absent,
 * so a visitor can tell they have reached the edge of the work.
 */
export function adjacentProjects(
  projects: ProjectRef[],
  currentSlug: string,
): { prev: ProjectRef | null; next: ProjectRef | null } {
  const index = projects.findIndex((project) => project.slug === currentSlug)
  if (index === -1) {
    return { prev: null, next: null }
  }
  return {
    prev: projects[index - 1] ?? null,
    next: projects[index + 1] ?? null,
  }
}
