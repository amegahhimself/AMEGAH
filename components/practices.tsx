import Image from 'next/image'
import Link from 'next/link'

import { hotspotPosition } from '@/lib/card-meta'
import type { Discipline } from '@/sanity/lib/content'
import { urlFor } from '@/sanity/lib/image'
import { Reveal } from './reveal'

export function Practices({ disciplines }: { disciplines: Discipline[] }) {
  if (disciplines.length === 0) return null

  return (
    <section className="border-t border-hairline px-6 py-24 md:py-32">
      <div className="mb-6 flex items-center gap-3">
        <span className="h-px w-6 bg-accent" aria-hidden="true" />
        <span className="index-meta">Showreels</span>
      </div>

      <h2 className="mb-14 text-4xl font-bold uppercase leading-[0.9] text-ink md:text-6xl">
        The Work In Motion
      </h2>
      <div className="grid grid-cols-1 gap-x-6 gap-y-12 md:grid-cols-3">
        {disciplines.map((discipline) => {
          const cover = discipline.coverImage

          return (
            <Reveal key={discipline._id}>
              <Link href={`/${discipline.slug}`} className="group block">
                <div
                  className={
                    cover?.asset
                      ? 'relative aspect-[4/5] w-full overflow-hidden bg-hairline'
                      : 'relative aspect-[4/5] w-full overflow-hidden border border-hairline'
                  }
                >
                  {cover?.asset && (
                    <Image
                      src={urlFor(cover).width(1200).auto('format').url()}
                      alt={discipline.title}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      placeholder={cover.lqip ? 'blur' : 'empty'}
                      blurDataURL={cover.lqip}
                      style={{ objectPosition: hotspotPosition(cover) }}
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                  )}
                </div>
                <h3 className="mt-4 text-2xl font-semibold text-ink">{discipline.title}</h3>
                {discipline.description && (
                  <p className="mt-2 max-w-[var(--measure)] text-ink-soft">{discipline.description}</p>
                )}
              </Link>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
