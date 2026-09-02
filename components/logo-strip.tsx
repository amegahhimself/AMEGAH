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

/**
 * The two labelled logo groups, with no chrome of their own.
 *
 * Use this inside a page that already provides its own heading and padding —
 * `LogoStrip` below is a full-width homepage band and would double the
 * horizontal padding and float a stray rule if nested.
 */
export function LogoGroups({
  clients,
  partners,
}: {
  clients: LogoRef[]
  partners: LogoRef[]
}) {
  if (clients.length === 0 && partners.length === 0) return null

  return (
    <div className="flex flex-col gap-16">
      <Group title="Clients" entries={clients} />
      <Group title="Partners" entries={partners} />
    </div>
  )
}

/** The homepage band: the logo groups plus their own rule and page padding. */
export function LogoStrip({
  clients,
  partners,
}: {
  clients: LogoRef[]
  partners: LogoRef[]
}) {
  if (clients.length === 0 && partners.length === 0) return null

  return (
    <section className="border-t border-hairline px-6 py-24">
      <LogoGroups clients={clients} partners={partners} />
    </section>
  )
}
