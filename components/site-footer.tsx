import type { SiteSettings } from '@/sanity/lib/content'

export function SiteFooter({ settings }: { settings: SiteSettings | null }) {
  return (
    <footer className="mt-32 border-t border-hairline px-6 py-16">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <p className="font-display text-ink" style={{ fontSize: 'clamp(2rem, 6vw, 4rem)' }}>
          Get in touch
        </p>

        <div className="flex flex-col gap-2">
          {settings?.email && (
            <a
              href={`mailto:${settings.email}`}
              className="inline-flex min-h-11 items-center text-ink-soft hover:text-ink"
            >
              {settings.email}
            </a>
          )}
          {settings?.phone && (
            <a
              href={`tel:${settings.phone}`}
              className="inline-flex min-h-11 items-center text-ink-soft hover:text-ink"
            >
              {settings.phone}
            </a>
          )}
          {settings?.instagramUrl && (
            <a
              href={settings.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="index-meta inline-flex min-h-11 items-center hover:text-ink"
            >
              Instagram
            </a>
          )}
        </div>
      </div>
    </footer>
  )
}
