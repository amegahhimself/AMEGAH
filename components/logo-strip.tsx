import Image from 'next/image'

import type { LogoRef } from '@/sanity/lib/content'
import { urlFor } from '@/sanity/lib/image'

function Logo({ entry }: { entry: LogoRef }) {
  const inner = entry.logo?.asset ? (
    <Image
      src={urlFor(entry.logo).width(400).auto('format').url()}
      alt={entry.name}
      width={140}
      height={70}
      className="h-10 w-auto object-contain opacity-60 transition-opacity duration-300 hover:opacity-100"
    />
  ) : (
    <span className="text-ink-muted transition-colors duration-300 hover:text-ink-soft">
      {entry.name}
    </span>
  )

  if (!entry.url) {
    return <div className="flex min-h-11 items-center">{inner}</div>
  }

  return (
    <a
      href={entry.url}
      target="_blank"
      rel="noreferrer"
      aria-label={entry.name}
      className="flex min-h-11 items-center"
    >
      {inner}
    </a>
  )
}

function Group({ title, entries }: { title: string; entries: LogoRef[] }) {
  if (entries.length === 0) return null

  return (
    <div>
      <h3 className="index-meta mb-8">{title}</h3>
      <div className="flex flex-wrap items-center gap-x-12 gap-y-8">
        {entries.map((entry) => (
          <Logo key={entry._id} entry={entry} />
        ))}
      </div>
    </div>
  )
}

/**
 * The homepage's Clients & Partners section. There is no separate /clients
 * page — see components/about-section.tsx's doc comment for why.
 */
export function LogoStrip({
  clients,
  partners,
}: {
  clients: LogoRef[]
  partners: LogoRef[]
}) {
  const isEmpty = clients.length === 0 && partners.length === 0

  return (
    <section id="clients" className="border-t border-hairline px-6 py-24 md:py-32">
      <div className="mb-6 flex items-center gap-3">
        <span className="h-px w-6 bg-accent" aria-hidden="true" />
        <span className="index-meta !text-accent">Collaborators</span>
      </div>

      <h2 aria-label="Clients & Partners" className="mb-14 leading-[0.9]">
        <span className="font-condensed block text-5xl uppercase text-ink md:text-7xl">
          Clients
        </span>
        <span className="text-outline mt-1 block font-display text-5xl italic md:text-7xl">
          &amp; Partners
        </span>
      </h2>

      {isEmpty ? (
        <p className="text-ink-muted">Client list coming soon.</p>
      ) : (
        <div className="flex flex-col gap-16">
          <Group title="Clients" entries={clients} />
          <Group title="Partners" entries={partners} />
        </div>
      )}
    </section>
  )
}
