'use client'

import Link from 'next/link'
import { useState } from 'react'

type NavDiscipline = { title: string; slug: string }

const STANDING_LINKS = [
  { title: 'About', href: '/about' },
  { title: 'Clients', href: '/clients' },
  { title: 'Contact', href: '/contact' },
]

export function SiteHeader({ disciplines }: { disciplines: NavDiscipline[] }) {
  const [open, setOpen] = useState(false)

  const links = [
    ...disciplines.map((d) => ({ title: d.title, href: `/${d.slug}` })),
    ...STANDING_LINKS,
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-ground/80 backdrop-blur">
      <div className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="font-display text-lg tracking-tight text-ink">
          Amegah
        </Link>

        <nav className="hidden gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="index-meta transition-colors hover:text-ink"
            >
              {link.title}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="index-meta md:hidden"
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-6 px-6 pb-10 pt-4 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="font-display text-3xl text-ink"
            >
              {link.title}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
