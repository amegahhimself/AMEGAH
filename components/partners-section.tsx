import type { LogoRef } from '@/sanity/lib/content'
import { OrgLogo } from './org-logo'

/**
 * The homepage's Partners section — split out from Clients into its own
 * entity per the client's explicit call: "can we make them two separate
 * entities" (2026-09-06 review). There is no separate /partners page — see
 * components/about-section.tsx's doc comment for why. Always renders (with
 * a "coming soon" fallback when empty) because #partners is a permanent
 * nav-anchor target.
 */
export function PartnersSection({ partners }: { partners: LogoRef[] }) {
  return (
    <section id="partners" className="border-t border-hairline px-6 py-24 md:py-32">
      <div className="mb-6 flex items-center gap-3">
        <span className="h-px w-6 bg-accent" aria-hidden="true" />
        <span className="index-meta">Collaborators</span>
      </div>

      <h2 className="mb-14 text-4xl font-bold uppercase leading-[0.9] text-ink md:text-6xl">
        Partners
      </h2>

      {partners.length === 0 ? (
        <p className="text-ink-muted">Partner list coming soon.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-x-12 gap-y-8">
          {partners.map((entry) => (
            <OrgLogo key={entry._id} entry={entry} />
          ))}
        </div>
      )}
    </section>
  )
}
