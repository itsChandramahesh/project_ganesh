interface AreaExplorerSectionProps {
  availableAreas: string[]
  selectedArea: string | null
  onAreaSelect: (area: string) => void
  onScrollToMandapams: () => void
}

export function AreaExplorerSection ({
  availableAreas,
  selectedArea,
  onAreaSelect,
  onScrollToMandapams
}: AreaExplorerSectionProps) {
  if (availableAreas.length === 0) {
    return null
  }

  return (
    <section
      className='border-t border-[var(--color-border)] bg-[var(--color-surface-muted)] py-16'
      aria-label='Explore by area'
    >
      <div className='container'>
        <h2 className='mb-5 text-2xl font-bold tracking-[-0.02em] text-[var(--color-text)]'>
          🗺️ Explore by Area
        </h2>
        <div className='flex flex-wrap gap-2'>
          {availableAreas.map(area => (
            <button
              key={area}
              type='button'
              onClick={() => {
                onAreaSelect(area)
                onScrollToMandapams()
              }}
              className={[
                'rounded-full border px-4 py-2 text-sm font-medium transition',
                selectedArea === area
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-dark)]'
                  : 'border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]'
              ].join(' ')}
              aria-pressed={selectedArea === area}
            >
              {area}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
