import Image from 'next/image'

import type { LogoRef } from '@/sanity/lib/content'
import { urlFor } from '@/sanity/lib/image'

/** A single client or partner credit — shared by ClientsSection and PartnersSection. */
export function OrgLogo({ entry }: { entry: LogoRef }) {
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
