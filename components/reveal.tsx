'use client'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

/**
 * Fades and rises its children into view once (spec §5.3).
 *
 * The element starts REVEALED and is hidden only after JavaScript has
 * confirmed it can animate it. If JS never runs, the observer never fires, or
 * the visitor prefers reduced motion, the content is simply visible — the
 * failure mode of the usual `opacity-0` default is a permanently blank page.
 *
 * One observer per element, disconnected the moment it fires: no scroll
 * handler, nothing retained after the reveal.
 */
export function Reveal({
  children,
  className,
}: {
  children: React.ReactNode
  /** Merged onto the wrapper div — lets callers pass layout classes (e.g. a
   *  grid span) that must live on the same element the grid tracks. */
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(true)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Guard for environments without the API rather than shipping a broken
    // hidden state to them.
    if (typeof IntersectionObserver === 'undefined') return

    const element = ref.current
    if (!element) return

    setRevealed(false)

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} data-revealed={revealed} className={cn('reveal', className)}>
      {children}
    </div>
  )
}
