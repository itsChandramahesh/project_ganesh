import { Link } from 'react-router-dom'

interface SubmissionSuccessProps {
  onReset: () => void
}

export function SubmissionSuccess ({ onReset }: SubmissionSuccessProps) {
  return (
    <div className='rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-8 sm:p-10'>
      <div className='flex flex-col items-center gap-5 text-center'>
        <span className='text-5xl leading-none' aria-hidden='true'>
          ✅
        </span>
        <h2 className='text-2xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-3xl'>
          Submission received
        </h2>
        <p className='max-w-xl text-base leading-7 text-[var(--color-text-secondary)]'>
          Thank you for helping Hyderabad discover more Ganesh mandapams.
        </p>
        <p className='max-w-xl text-base leading-7 text-[var(--color-text-secondary)]'>
          Your submission has been sent for review and will appear after
          verification.
        </p>

        <div className='flex w-full max-w-lg flex-col gap-3 sm:flex-row sm:justify-center'>
          <Link
            to='/'
            className='inline-flex flex-1 items-center justify-center rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)]'
          >
            ← Explore Mandapams
          </Link>
          <button
            type='button'
            onClick={onReset}
            className='inline-flex flex-1 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-5 py-3 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)]'
          >
            ➕ Add Another
          </button>
        </div>
      </div>
    </div>
  )
}
