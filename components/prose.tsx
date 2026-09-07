import { PortableText, type PortableTextComponents } from '@portabletext/react'

import type { PortableTextValue } from '@/sanity/lib/content'

// Both fields this renders — project.description and siteSettings.bio —
// restrict the block to the normal style, the strong/em decorators and the
// link annotation.
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
    // The browser default <strong> is bold but stays the body's own muted
    // colour, so it barely reads as emphasis against the surrounding text.
    // Brightening it to full ink is what actually makes a client's bolded
    // phrase (a name, a credential) stand out on the page.
    strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  },
}

/**
 * Whether prose holds any actual text.
 *
 * Studio leaves an empty array — or a block whose spans are all empty — when
 * the client types into a field and then clears it. Both look non-empty to a
 * truthiness check but render as nothing, so callers deciding whether to show
 * a fallback must ask this rather than test the value itself.
 */
export function hasProse(value?: PortableTextValue): boolean {
  if (!value || value.length === 0) return false

  return value.some((block) => {
    const children = (block as { children?: { text?: string }[] }).children
    // A block with no children array isn't a text block; nothing renders it
    // today, but don't silently hide content this helper doesn't understand.
    if (!children) return true
    return children.some((child) => (child.text ?? '').trim() !== '')
  })
}

/**
 * Prose the client wrote in Studio, rendered at a comfortable reading width.
 * One definition of what a link looks like, shared by every page that renders
 * CMS prose, so a project description and a biography cannot drift apart.
 */
export function Prose({ value }: { value?: PortableTextValue }) {
  if (!hasProse(value)) return null

  return (
    <div className="max-w-[var(--measure)] text-ink-soft [&_p]:mt-4">
      <PortableText value={value} components={components} />
    </div>
  )
}
