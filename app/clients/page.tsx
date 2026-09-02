import { Suspense } from 'react'

import { LogoStrip } from '@/components/logo-strip'
import { getClients, getPartners } from '@/sanity/lib/content'

export function generateMetadata() {
  return { title: 'Clients & Partners — Amegah' }
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] animate-pulse bg-hairline" />}>
      <ClientsView />
    </Suspense>
  )
}

async function ClientsView() {
  const [clients, partners] = await Promise.all([
    getClients().catch(() => []),
    getPartners().catch(() => []),
  ])

  const isEmpty = clients.length === 0 && partners.length === 0

  return (
    <section className="px-6 py-20 md:py-28">
      <h1
        className="font-display text-ink"
        style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', lineHeight: 1.05 }}
      >
        Clients &amp; Partners
      </h1>

      {/*
        LogoStrip already renders the two labelled sections, the logo grids and
        the outbound links, and hides a group that has no entries. This check
        exists only so the page says something when BOTH are empty, rather than
        leaving a heading over nothing.
      */}
      {isEmpty ? (
        <p className="mt-12 text-ink-muted">Client list coming soon.</p>
      ) : (
        <LogoStrip clients={clients} partners={partners} />
      )}
    </section>
  )
}
