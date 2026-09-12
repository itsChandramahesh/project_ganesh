interface AreaFilterProps {
  areas: string[]
  selectedArea: string | null
  onSelect: (area: string | null) => void
}

export function AreaFilter ({ areas, selectedArea, onSelect }: AreaFilterProps) {
  if (areas.length === 0) return null

  return (
    <div className='w-full' role='group' aria-label='Filter by area'>
      <div className='flex flex-wrap items-center justify-center gap-2 pb-1 sm:justify-start'>
        <button
          type='button'
          onClick={() => onSelect(null)}
          className={[
            'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition',
            !selectedArea
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
              : 'border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]'
          ].join(' ')}
          aria-pressed={!selectedArea}
        >
          All Areas
        </button>

        {areas.map(area => (
          <button
            key={area}
            type='button'
            onClick={() => onSelect(selectedArea === area ? null : area)}
            className={[
              'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition',
              selectedArea === area
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                : 'border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]'
            ].join(' ')}
            aria-pressed={selectedArea === area}
          >
            {area}
          </button>
        ))}
      </div>
    </div>
  )
}
