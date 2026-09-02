import Image from 'next/image'
import { Suspense } from 'react'

import { Prose, hasProse } from '@/components/prose'
import { hotspotPosition } from '@/lib/card-meta'
import { getSiteSettings } from '@/sanity/lib/content'
import { urlFor } from '@/sanity/lib/image'

export async function generateMetadata() {
  const settings = await getSiteSettings().catch(() => null)
  const name = settings?.name ?? 'Amegah'
  return {
    title: `About — ${name}`,
    ...(settings?.role && { description: settings.role }),
  }
}

export default function AboutPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] animate-pulse bg-hairline" />}>
      <AboutView />
    </Suspense>
  )
}

async function AboutView() {
  const settings = await getSiteSettings().catch(() => null)
  const headshot = settings?.headshot
  const bio = settings?.bio

  return (
    <section className="px-6 py-20 md:py-28">
      <h1
        className="font-display text-ink"
        style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', lineHeight: 1.05 }}
      >
        About
      </h1>

      <div className="mt-12 flex flex-col gap-12 md:flex-row md:gap-16">
        {headshot?.asset && (
          <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-hairline md:w-2/5">
            <Image
              src={urlFor(headshot).width(1200).auto('format').url()}
              alt={settings?.name ?? 'Amegah'}
              fill
              priority
              sizes="(min-width: 768px) 40vw, 100vw"
              placeholder={headshot.lqip ? 'blur' : 'empty'}
              blurDataURL={headshot.lqip}
              style={{ objectPosition: hotspotPosition(headshot) }}
              className="object-cover"
            />
          </div>
        )}

        <div className="flex-1">
          {settings?.role && <p className="index-meta mb-6">{settings.role}</p>}
          {/* Spec §6.5: the bio is set in serif at the ~65ch measure. */}
          {hasProse(bio) ? (
            <Prose value={bio} serif />
          ) : (
            // A missing biography reads as an unfinished page unless it says
            // something; the client may publish before writing this.
            <p className="text-ink-muted">Biography coming soon.</p>
          )}
        </div>
      </div>
    </section>
  )
}
