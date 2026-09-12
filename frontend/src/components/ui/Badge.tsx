import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'featured' | 'verified' | 'pending' | 'default'
  className?: string
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  featured: 'border-amber-200 bg-amber-50 text-amber-700',
  verified: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  pending:
    'border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]',
  default:
    'border-[var(--color-border)] bg-[var(--color-primary-soft)] text-[var(--color-primary-dark)]'
}

export function Badge ({
  children,
  variant = 'default',
  className = ''
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5',
        'text-[10px] font-semibold uppercase tracking-[0.1em]',
        variantStyles[variant],
        className
      ].join(' ')}
    >
      {children}
    </span>
  )
}
