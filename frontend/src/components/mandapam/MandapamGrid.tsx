import type { Mandapam } from '../../types/mandapam'
import { MandapamCard } from './MandapamCard'

interface MandapamGridProps {
  mandapams: Mandapam[]
  /** Per-card distances in km — keyed by mandapam id */
  distances?: Record<string, number>
  /** Label shown above the grid */
  heading?: string
  /** Message when results list is empty */
  emptyMessage?: string
  /** Callback to clear filters */
  onClearFilters?: () => void
}

export function MandapamGrid ({
  mandapams,
  distances,
  heading,
  emptyMessage = 'No mandapams found.',
  onClearFilters
}: MandapamGridProps) {
  if (mandapams.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center px-4 py-16 text-center text-[var(--color-text-secondary)]'>
        <span className='mb-3 text-5xl opacity-60' aria-hidden='true'>
          🔍
        </span>
        <p className='text-base text-[var(--color-text-secondary)]'>
          {emptyMessage}
        </p>
        {onClearFilters && (
          <button
            type='button'
            onClick={onClearFilters}
            className='mt-3 inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)]'
          >
            Clear filters
          </button>
        )}
      </div>
    )
  }

  return (
    <div className='mx-auto max-w-[1400px]'>
      {heading && (
        <p className='mb-4 text-sm text-[var(--color-text-muted)]'>
          {mandapams.length} mandapam{mandapams.length !== 1 ? 's' : ''} found
        </p>
      )}

      <div className='columns-1 gap-[14px] sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5'>
        {mandapams.map(m => (
          <div key={m.id} className='mb-[14px] break-inside-avoid'>
            <MandapamCard mandapam={m} distanceKm={distances?.[m.id]} />
          </div>
        ))}
      </div>
    </div>
  )
}
