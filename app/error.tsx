'use client'

// Error boundaries must be Client Components (app/error.tsx convention).
// Next 16 renamed the recovery callback from `reset` to `retry` — this is
// not the reset() you may remember from earlier Next.js versions.
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-24 text-center">
      <span className="index-meta mb-6 text-ink-muted">Error</span>
      <h1 className="mb-6 text-4xl font-bold uppercase leading-[0.9] text-ink md:text-6xl">
        Something Went Wrong
      </h1>
      <p className="mb-12 max-w-[var(--measure)] text-ink-soft">
        {error.digest
          ? `An unexpected error occurred (ref: ${error.digest}).`
          : 'An unexpected error occurred.'}
      </p>
      <button
        type="button"
        onClick={retry}
        className="index-meta inline-flex min-h-11 items-center border border-hairline px-6 transition-colors hover:border-ink-soft hover:text-ink"
      >
        Try Again
      </button>
    </div>
  )
}
