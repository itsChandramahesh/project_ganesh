interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar ({
  value,
  onChange,
  placeholder = 'Search mandapams or areas...'
}: SearchBarProps) {
  return (
    <div className='relative mx-auto mb-4 w-full'>
      <span
        className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-[var(--color-text-muted)]'
        aria-hidden='true'
      >
        🔍
      </span>
      <input
        id='mandapam-search'
        type='search'
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className='w-full rounded-full border border-[var(--color-border)] bg-white py-3 pl-11 pr-11 text-base text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[rgba(232,121,47,0.12)]'
        autoComplete='off'
        autoCorrect='off'
        spellCheck={false}
        aria-label='Search mandapams'
      />
      {value && (
        <button
          type='button'
          onClick={() => onChange('')}
          className='absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[0.7rem] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-border)]'
          aria-label='Clear search'
        >
          ✕
        </button>
      )}
    </div>
  )
}
