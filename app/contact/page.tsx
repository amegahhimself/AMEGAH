import { Suspense } from 'react'

import { getSiteSettings } from '@/sanity/lib/content'

// No contact form: the brief asks for contact information, and a form would
// add a backend, a spam surface and deliverability problems for nothing that
// was requested. See the spec, §6.5.

export async function generateMetadata() {
  const settings = await getSiteSettings().catch(() => null)
  return { title: `Contact — ${settings?.name ?? 'Amegah'}` }
}

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] animate-pulse bg-hairline" />}>
      <ContactView />
    </Suspense>
  )
}

async function ContactView() {
  const settings = await getSiteSettings().catch(() => null)
  const hasAny = Boolean(settings?.email || settings?.phone || settings?.instagramUrl)

  return (
    <section className="px-6 py-20 md:py-28">
      <h1
        className="font-display text-ink"
        style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', lineHeight: 1.05 }}
      >
        Contact
      </h1>

      {!hasAny ? (
        <p className="mt-12 text-ink-muted">Contact details coming soon.</p>
      ) : (
        // inline-flex, not inline: min-height is inert on a plain inline
        // element, so these would not actually meet the 44px touch target.
        <div className="mt-16 flex flex-col gap-10">
          {settings?.email && (
            <div>
              <p className="index-meta mb-3">Email</p>
              <a
                href={`mailto:${settings.email}`}
                className="font-display inline-flex min-h-11 items-center text-ink hover:text-ink-soft"
                style={{ fontSize: 'clamp(1.5rem, 5vw, 3.5rem)', lineHeight: 1.1 }}
              >
                {settings.email}
              </a>
            </div>
          )}

          {settings?.phone && (
            <div>
              <p className="index-meta mb-3">Phone</p>
              <a
                href={`tel:${settings.phone}`}
                className="font-display inline-flex min-h-11 items-center text-ink hover:text-ink-soft"
                style={{ fontSize: 'clamp(1.25rem, 3vw, 2rem)', lineHeight: 1.1 }}
              >
                {settings.phone}
              </a>
            </div>
          )}

          {settings?.instagramUrl && (
            <div>
              <p className="index-meta mb-3">Instagram</p>
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-ink-soft underline underline-offset-4 hover:text-ink"
              >
                {settings.instagramUrl.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
