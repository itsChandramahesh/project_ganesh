import { AreaFilter } from '../search/AreaFilter'
import { SearchBar } from '../search/SearchBar'

interface SearchAndFilterSectionProps {
  searchQuery: string
  selectedArea: string | null
  availableAreas: string[]
  onSearchChange: (value: string) => void
  onAreaSelect: (area: string | null) => void
}

export function SearchAndFilterSection ({
  searchQuery,
  selectedArea,
  availableAreas,
  onSearchChange,
  onAreaSelect
}: SearchAndFilterSectionProps) {
  return (
    <section
      className='border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-5 md:py-6'
      aria-label='Search and filter'
    >
      <div className='container'>
        <div className='mx-auto max-w-[1100px]'>
          <SearchBar value={searchQuery} onChange={onSearchChange} />
          <AreaFilter
            areas={availableAreas}
            selectedArea={selectedArea}
            onSelect={onAreaSelect}
          />
        </div>
      </div>
    </section>
  )
}
