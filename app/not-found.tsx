import type { Metadata } from 'next'
import Link from 'next/link'

// Without its own title this page silently inherited the root layout's
// marketing title, so a broken link's browser tab looked identical to a
// real page.
export const metadata: Metadata = {
  title: 'Page Not Found — Amegah',
}

// A 404 page is normally reached by a broken/typoed URL — an unauthenticated
// GET, never a form or user-supplied side effect — so it's plain content,
// not something that needs client-side interactivity.
export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-24 text-center">
      <span className="index-meta mb-6 text-ink-muted">404</span>
      <h1 className="mb-6 text-4xl font-bold uppercase leading-[0.9] text-ink md:text-6xl">
        Page Not Found
      </h1>
      <p className="mb-12 max-w-[var(--measure)] text-ink-soft">
        The page you&rsquo;re looking for doesn&rsquo;t exist or has moved.
      </p>
      <Link
        href="/"
        className="index-meta inline-flex min-h-11 items-center border border-hairline px-6 transition-colors hover:border-ink-soft hover:text-ink"
      >
        Back to Home
      </Link>
    </div>
  )
}
