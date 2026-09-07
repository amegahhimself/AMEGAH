'use client'

import { Menu as MenuIcon, X as XIcon } from 'lucide-react'
import Image from 'next/image'
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
  { title: 'Partners', href: '/#partners' },
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

  // The overlay is always mounted (never conditionally rendered) so its
  // opacity transition can actually play on close, not just on open — a
  // conditionally-rendered element vanishes on the same tick `open` flips,
  // there's no time left for a CSS transition to run. `inert` (not just
  // aria-hidden) is what stops a keyboard user tabbing into off-screen
  // links while it's faded out — aria-hidden alone hides it from screen
  // readers but doesn't remove it from the tab order.
  useEffect(() => {
    if (navRef.current) navRef.current.inert = !open
  }, [open])

  function close() {
    setOpen(false)
    menuButtonRef.current?.focus()
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-hairline bg-ground/80 backdrop-blur">
        <div className="flex items-start justify-between gap-4 px-6 py-4 md:items-center">
          <Link href="/" className="leading-none">
            {/* The client's full logo also has a jagged distressed
                wordmark that was illegible and visually clashing at header
                size (confirmed in review). This icon is the gorilla mark
                only, trimmed from a cleaner transparent source the client
                sent separately (public/logo-full.png) — paired with our
                own typeset name so the client's mark is on the page
                without it fighting the rest of the site. */}
            <div className="flex items-center gap-2">
              <Image
                src="/logo-icon.png"
                alt=""
                width={116}
                height={138}
                className="h-8 w-auto"
                priority
              />
              <span className="block text-xl font-bold uppercase tracking-tight text-ink">
                {name}
              </span>
            </div>
            {settings?.role && (
              <span className="index-meta mt-0.5 block">{settings.role}</span>
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
            {open ? (
              <XIcon className="size-5" aria-hidden="true" />
            ) : (
              <MenuIcon className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      <nav
        ref={navRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!open}
        className={`fixed inset-0 z-40 flex flex-col gap-6 overflow-y-auto bg-ground/90 px-6 pb-10 pt-24 backdrop-blur-md transition-opacity duration-300 md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={close}
            className="text-3xl font-bold text-ink"
          >
            {link.title}
          </Link>
        ))}
      </nav>
    </>
  )
}
