import type { SanityImage } from '@/sanity/lib/content'

/**
 * The archival index device from spec section 5.2 — `01 — Music Videos — 2025`.
 * Missing parts are dropped rather than printed empty.
 */
export function indexLabel({
  index,
  category,
  year,
}: {
  index: number
  category?: string
  year?: number
}): string {
  const parts: string[] = [String(index + 1).padStart(2, '0')]
  if (category) parts.push(category)
  if (year) parts.push(String(year))
  return parts.join(' — ')
}

/**
 * Turns Sanity's hotspot into a CSS object-position, so a cropped card keeps
 * the subject in frame at every aspect ratio (client brief section 5).
 */
export function hotspotPosition(image?: SanityImage): string {
  const x = image?.hotspot?.x ?? 0.5
  const y = image?.hotspot?.y ?? 0.5
  return `${+(x * 100).toFixed(2)}% ${+(y * 100).toFixed(2)}%`
}
