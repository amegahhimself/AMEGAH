/**
 * Serialises the active filter into a shareable query string. An unfiltered
 * view has no query at all, so the discipline page keeps one canonical URL.
 */
export function buildFilterQuery({
  category,
  type,
}: {
  category: string | null
  type: string | null
}): string {
  if (!category) return ''
  const params = new URLSearchParams({ category })
  if (type) params.set('type', type)
  return `?${params.toString()}`
}
