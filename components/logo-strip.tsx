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
      <h2 className="index-meta mb-8">{title}</h2>
      <div className="flex flex-wrap items-center gap-x-12 gap-y-8">
        {entries.map((entry) => (
          <Logo key={entry._id} entry={entry} />
        ))}
      </div>
    </div>
  )
}

export function LogoStrip({
  clients,
  partners,
}: {
  clients: LogoRef[]
  partners: LogoRef[]
}) {
  if (clients.length === 0 && partners.length === 0) return null

  return (
    <section className="flex flex-col gap-16 border-t border-hairline px-6 py-24">
      <Group title="Clients" entries={clients} />
      <Group title="Partners" entries={partners} />
    </section>
  )
}
