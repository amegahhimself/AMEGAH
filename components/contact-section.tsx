import type { SiteSettings } from '@/sanity/lib/content'

// No contact form: the brief asks for contact information, and a form would
// add a backend, a spam surface and deliverability problems for nothing that
// was requested. See the spec, §6.5. The reference layout this section
// matches has one — deliberately not copied for the same reason.

/**
 * The digits WhatsApp's click-to-chat link (wa.me/<number>) needs: full
 * international number, no spaces, dashes, parentheses or leading "+".
 * Parenthesized digits are dropped outright rather than just unwrapped —
 * they're conventionally a trunk prefix (e.g. the "(0)" in a Ghanaian
 * "+233 (0) 55 976 0048") that's meaningless once the country code is
 * already present, and wa.me rejects a number that still has it.
 */
function whatsAppNumber(phone: string): string {
  return phone.replace(/\([^)]*\)/g, '').replace(/\D/g, '')
}

/**
 * The site-wide Contact/footer block, rendered once from app/layout.tsx so
 * every page ends the same way. There is no separate /contact page and no
 * separate plain footer — a bare "get in touch" footer under this section
 * on the homepage was pure duplication, so this replaced it outright. See
 * components/about-section.tsx's doc comment for the same reasoning on
 * About/Clients.
 */
export function ContactSection({ settings }: { settings: SiteSettings | null }) {
  const hasAny = Boolean(settings?.email || settings?.phone || settings?.instagramUrl)

  return (
    <footer id="contact" className="border-t border-hairline px-6 py-24 md:py-32">
      <div className="mb-6 flex items-center gap-3">
        <span className="h-px w-6 bg-accent" aria-hidden="true" />
        <span className="index-meta">Let&rsquo;s Collaborate</span>
      </div>

      <h2 className="mb-8 text-4xl font-bold uppercase leading-[0.9] text-ink md:text-6xl">
        Let&rsquo;s Make Something
      </h2>

      {settings?.role && (
        <p className="max-w-[var(--measure)] text-ink-soft">
          Available for {settings.role.toLowerCase()} work.
        </p>
      )}

      {!hasAny ? (
        <p className="mt-12 text-ink-muted">Contact details coming soon.</p>
      ) : (
        <div className="mt-16 flex max-w-md flex-col">
          {settings?.phone && (
            <div className="border-t border-hairline py-6">
              <p className="index-meta mb-2">Phone</p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                {/* inline-flex, not inline: min-height is inert on a plain
                    inline element, so this would not actually meet the 44px
                    touch target without it. */}
                <a
                  href={`tel:${settings.phone}`}
                  className="inline-flex min-h-11 items-center text-lg font-semibold text-ink hover:text-ink-soft"
                >
                  {settings.phone}
                </a>
                <a
                  href={`https://wa.me/${whatsAppNumber(settings.phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="index-meta inline-flex min-h-11 items-center border border-hairline px-4 transition-colors hover:border-ink-soft hover:text-ink"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          )}

          {settings?.email && (
            <div className="border-t border-hairline py-6">
              <p className="index-meta mb-2">Email</p>
              <a
                href={`mailto:${settings.email}`}
                className="inline-flex min-h-11 items-center text-lg font-semibold text-ink hover:text-ink-soft"
              >
                {settings.email}
              </a>
            </div>
          )}

          {settings?.instagramUrl && (
            <div className="border-t border-b border-hairline py-6">
              <p className="index-meta mb-2">Instagram</p>
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-lg font-semibold text-ink hover:text-ink-soft"
              >
                {settings.instagramUrl.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            </div>
          )}
        </div>
      )}
    </footer>
  )
}
