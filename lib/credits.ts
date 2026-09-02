import type { ProjectDetail } from '@/sanity/lib/content'

/**
 * The archival metadata line on a project page — the same device the cards
 * use, without the running index. Empty parts are dropped, never printed
 * as gaps.
 */
export function creditLine(project: ProjectDetail): string {
  return [project.discipline?.title, project.category?.title, project.year]
    .filter(Boolean)
    .join(' · ')
}
