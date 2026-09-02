import type { Cadence } from '@/sanity/lib/content'

export type CadenceLayout = {
  /** Tailwind grid classes for the project grid. */
  grid: string
  /** Tailwind aspect-ratio class for each card's image. */
  aspect: string
  /** The `sizes` attribute for next/image, matching the grid's columns. */
  sizes: string
}

/**
 * Each discipline reads in the same visual language but a different rhythm
 * (spec section 6.3). Every cadence starts single-column so phones get one
 * project at a time rather than a squeezed desktop grid.
 */
const LAYOUTS: Record<Cadence, CadenceLayout> = {
  cinematic: {
    grid: 'grid grid-cols-1 gap-x-8 gap-y-20 md:grid-cols-2',
    aspect: 'aspect-video',
    sizes: '(min-width: 768px) 50vw, 100vw',
  },
  filmstrip: {
    grid: 'grid grid-cols-1 gap-x-3 gap-y-10 sm:grid-cols-2 lg:grid-cols-3',
    aspect: 'aspect-[3/2]',
    sizes: '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
  },
  editorial: {
    grid: 'grid grid-cols-1 gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-3',
    aspect: 'aspect-[4/5]',
    sizes: '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
  },
}

export function cadenceLayout(cadence: Cadence | undefined): CadenceLayout {
  return (cadence && LAYOUTS[cadence]) || LAYOUTS.editorial
}
