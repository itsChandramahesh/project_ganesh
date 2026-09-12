import { MandapamGrid } from '../mandapam/MandapamGrid'
import type { Mandapam } from '../../types/mandapam'
import { SearchAndFilterSection } from './SearchAndFilterSection'

interface AllMandapamsSectionProps {
  allMandapams: Mandapam[]
  filteredMandapams: Mandapam[]
  selectedArea: string | null
  hasActiveFilters: boolean
  showMandapamLoadingState: boolean
  sortByDistance: boolean
  distanceMap: Record<string, number>
  onClearAllFilters: () => void
  searchQuery: string
  availableAreas: string[]
  onSearchChange: (value: string) => void
  onAreaSelect: (area: string | null) => void
}

export function AllMandapamsSection ({
  allMandapams,
  filteredMandapams,
  selectedArea,
  hasActiveFilters,
  showMandapamLoadingState,
  sortByDistance,
  distanceMap,
  onClearAllFilters,
  searchQuery,
  availableAreas,
  onSearchChange,
  onAreaSelect
}: AllMandapamsSectionProps) {
  return (
    <section
      id='all-mandapams'
      className='bg-[var(--color-surface-muted)] py-16'
      aria-label='All mandapams'
    >
      <div className='container'>
        <div className='mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
          <div className='max-w-2xl'>
            <p className='mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]'>
              Ganesh Darshan Hyderabad
            </p>
            <h2 className='text-3xl font-bold tracking-[-0.04em] text-[var(--color-text)] sm:text-4xl'>
              {selectedArea
                ? `Discover ${selectedArea}`
                : 'Discover Ganesh Mandapams'}
            </h2>
            <p className='mt-3 text-base text-[var(--color-text-secondary)]'>
              Explore Ganesh celebrations, mandapams and traditions across
              Hyderabad.
            </p>
          </div>

          <div className='flex flex-wrap items-center gap-3'>
            <div className='rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--color-text-secondary)]'>
              {filteredMandapams.length} registered
              {filteredMandapams.length === 1 ? '' : 'd'}
            </div>
            {hasActiveFilters && (
              <button
                type='button'
                onClick={onClearAllFilters}
                className='inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]'
              >
                ✕ Clear filters
              </button>
            )}
          </div>
        </div>

        <div className='mb-8'>
          <SearchAndFilterSection
            searchQuery={searchQuery}
            selectedArea={selectedArea}
            availableAreas={availableAreas}
            onSearchChange={onSearchChange}
            onAreaSelect={onAreaSelect}
          />
        </div>

        {showMandapamLoadingState ? (
          <div className='space-y-4' aria-live='polite'>
            <div className='flex items-center gap-3'>
              <span className='h-3 w-24 animate-pulse rounded-full bg-[var(--color-border-strong)]' />
              <span className='h-3 w-60 animate-pulse rounded-full bg-[var(--color-border-strong)]' />
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className='overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white'
                >
                  <div className='h-56 w-full animate-pulse bg-[var(--color-border)]' />
                  <div className='space-y-3 p-4'>
                    <div className='h-4 w-2/3 animate-pulse rounded-full bg-[var(--color-border)]' />
                    <div className='h-3 w-1/2 animate-pulse rounded-full bg-[var(--color-border)]' />
                    <div className='h-3 w-3/4 animate-pulse rounded-full bg-[var(--color-border)]' />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <MandapamGrid
            mandapams={filteredMandapams}
            distances={sortByDistance ? distanceMap : undefined}
            heading='count'
            emptyMessage={
              allMandapams.length === 0
                ? 'No mandapams added yet. Be the first to add one!'
                : selectedArea
                ? `No mandapams found in ${selectedArea}.`
                : 'No mandapams match your search.'
            }
            onClearFilters={hasActiveFilters ? onClearAllFilters : undefined}
          />
        )}
      </div>
    </section>
  )
}
