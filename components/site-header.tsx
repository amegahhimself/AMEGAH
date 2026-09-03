'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import type { SiteSettings } from '@/sanity/lib/content'

type NavDiscipline = { title: string; slug: string }

// These scroll to sections on the homepage rather than routing to a
// dedicated page — see app/page.tsx. `/#about` (with the leading slash)
// works from any route: Next.js navigates home first, then scrolls, exactly
// like a plain anchor does when already on `/`. No standalone Contact link:
// the "Hire {name}" CTA already points at `/#contact`, so a plain Contact
// link would be a redundant second route to the same anchor.
const STANDING_LINKS = [
  { title: 'About', href: '/#about' },
  { title: 'Clients', href: '/#clients' },
]

// Matches HomeHero's own fallback, so the header and hero never disagree
// about the name when Site Settings hasn't been published yet.
const FALLBACK_NAME = 'Amegah'

export function SiteHeader({
  disciplines,
  settings,
}: {
  disciplines: NavDiscipline[]
  settings: SiteSettings | null
}) {
  const name = settings?.name || FALLBACK_NAME
  const [open, setOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const navRef = useRef<HTMLElement>(null)

  const links = [
    ...disciplines.map((d) => ({ title: d.title, href: `/${d.slug}` })),
    ...STANDING_LINKS,
  ]

  // WCAG 2.4.3 / 2.1.2: the overlay covers the page visually, so a keyboard
  // user tabbing past its last link must not land on content hidden behind
  // it. Trap Tab/Shift+Tab within the menu button + its links while open,
  // support Escape to close, and return focus to the trigger on close.
  useEffect(() => {
    if (!open) return

    const nav = navRef.current
    const menuButton = menuButtonRef.current
    if (!nav || !menuButton) return

    const links = Array.from(nav.querySelectorAll<HTMLElement>('a[href]'))
    const focusable = [menuButton, ...links]
    focusable[1]?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        menuButtonRef.current?.focus()
        return
      }
      if (event.key !== 'Tab' || focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  function close() {
    setOpen(false)
    menuButtonRef.current?.focus()
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-hairline bg-ground/80 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-4">
          <Link href="/" className="leading-none">
            <span className="font-condensed block text-xl uppercase tracking-tight text-ink">
              {name}
            </span>
            {settings?.role && (
              <span className="index-meta mt-0.5 block !text-accent">{settings.role}</span>
            )}
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="index-meta transition-colors hover:text-ink"
              >
                {link.title}
              </Link>
            ))}
            <Link
              href="/#contact"
              className="index-meta inline-flex min-h-11 items-center border border-accent px-4 !text-accent transition-colors hover:bg-accent hover:!text-accent-ink"
            >
              Hire {name.split(' ')[0]}
            </Link>
          </nav>

          <button
            ref={menuButtonRef}
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="index-meta inline-flex min-h-11 min-w-11 items-center justify-center border border-hairline px-3 transition-colors hover:border-ink-soft md:hidden"
          >
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
      </header>

      {open && (
        <nav
          ref={navRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-40 flex flex-col gap-6 overflow-y-auto bg-ground px-6 pb-10 pt-24 md:hidden"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="font-display text-3xl text-ink"
            >
              {link.title}
            </Link>
          ))}
        </nav>
      )}
    </>
  )
}
