import { PortableText, type PortableTextComponents } from '@portabletext/react'

import type { PortableTextValue } from '@/sanity/lib/content'

// Both fields this renders — project.description and siteSettings.bio —
// restrict the block to the normal style and the link annotation, so a link
// is the only mark needing styling: an underline via the existing tokens, no
// ad-hoc colour.
const components: PortableTextComponents = {
  marks: {
    link: ({ value, children }) => (
      <a
        href={value?.href}
        className="underline underline-offset-2 hover:text-ink"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
  },
}

/**
 * Prose the client wrote in Studio, rendered at a comfortable reading width.
 * One definition of what a link looks like, shared by every page that renders
 * CMS prose, so a project description and a biography cannot drift apart.
 */
export function Prose({ value }: { value?: PortableTextValue }) {
  if (!value || value.length === 0) return null

  return (
    <div className="max-w-[var(--measure)] text-ink-soft [&_p]:mt-4">
      <PortableText value={value} components={components} />
    </div>
  )
}
