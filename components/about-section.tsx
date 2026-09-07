import Image from 'next/image'

import { Prose, hasProse } from '@/components/prose'
import { hotspotPosition } from '@/lib/card-meta'
import type { SiteSettings } from '@/sanity/lib/content'
import { urlFor } from '@/sanity/lib/image'

const FALLBACK_NAME = 'Amegah'

/**
 * The homepage's About section — headshot and the real bio. There is no
 * separate /about page: this is the whole thing, not a preview of it (the
 * site moved to a single page for About/Clients/Contact, all reachable as
 * anchors from the header nav — see components/site-header.tsx).
 *
 * Never renders nothing: the name always exists (matches HomeHero's own
 * fallback), so there's always a heading even before the client has written
 * a bio or uploaded a photo.
 */
export function AboutSection({ settings }: { settings: SiteSettings | null }) {
  const name = settings?.name || FALLBACK_NAME
  const headshot = settings?.headshot
  const bio = settings?.bio
  // A short accent word under the name — the first discipline in the role
  // line, e.g. "Director" out of "Director · Cinematographer · Photographer" —
  // real data, not invented copy, kept short enough to read at display size.
  const accent = settings?.role?.split('·')[0]?.trim()

  return (
    <section id="about" className="px-6 py-24 md:py-32">
      <div className="mb-6 flex items-center gap-3">
        <span className="h-px w-6 bg-accent" aria-hidden="true" />
        <span className="index-meta">The Filmmaker</span>
      </div>

      <h2 aria-label={`About ${name}`} className="mb-14 leading-[0.9]">
        <span className="block text-4xl font-bold uppercase text-ink md:text-6xl">{name}</span>
        {accent && (
          <span className="mt-1 block text-4xl font-medium uppercase text-ink-soft md:text-6xl">
            {accent}
          </span>
        )}
      </h2>

      <div className="flex flex-col gap-12 md:flex-row md:gap-16">
        {headshot?.asset && (
          <div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden bg-hairline md:w-2/5">
            <Image
              src={urlFor(headshot).width(1200).auto('format').url()}
              alt={name}
              fill
              sizes="(min-width: 768px) 40vw, 100vw"
              placeholder={headshot.lqip ? 'blur' : 'empty'}
              blurDataURL={headshot.lqip}
              style={{ objectPosition: hotspotPosition(headshot) }}
              className="object-cover grayscale"
            />
          </div>
        )}

        <div className="flex flex-1 flex-col justify-center gap-8">
          {hasProse(bio) ? (
            <Prose value={bio} />
          ) : (
            <p className="text-ink-muted">Biography coming soon.</p>
          )}
        </div>
      </div>
    </section>
  )
}
