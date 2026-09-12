import { useState, FormEvent, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { adminLogin, checkAdminAuth } from '../../services/adminApi'

export function AdminLoginPage () {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    checkAdminAuth().then(res => {
      if (mounted && res.authenticated) {
        navigate('/admin', { replace: true })
      }
    })
    return () => {
      mounted = false
    }
  }, [navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Please enter both email and password.')
      return
    }

    setIsLoading(true)
    try {
      const res = await adminLogin(email.trim(), password)
      if (!res.success) {
        setError(res.error || 'Invalid credentials. Please try again.')
        setIsLoading(false)
        return
      }
      navigate('/admin', { replace: true })
    } catch {
      setError('An unexpected error occurred during login. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className='flex min-h-screen flex-col bg-[var(--color-surface-muted)]'>
      <header className='sticky top-0 z-50 border-b border-[var(--color-border)] bg-white/90 backdrop-blur-sm'>
        <div className='mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8'>
          <Link
            to='/'
            className='flex shrink-0 items-center gap-3'
            aria-label='Ganesh Darshan home'
          >
            <span className='text-2xl leading-none' aria-hidden='true'>
              🕉️
            </span>
            <span className='flex flex-col leading-none'>
              <span className='text-base font-bold text-[var(--color-text)]'>
                Ganesh Darshan
              </span>
              <span className='text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-primary-dark)]'>
                Admin Portal
              </span>
            </span>
          </Link>
          <Link
            to='/'
            className='inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]'
          >
            ← Back to Site
          </Link>
        </div>
      </header>

      <main className='flex flex-1 items-center justify-center px-4 py-8 sm:px-6'>
        <div className='w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-7 sm:p-8'>
          <div className='mb-6 text-center'>
            <span
              className='mb-3 block text-4xl leading-none'
              aria-hidden='true'
            >
              🔒
            </span>
            <h1 className='text-2xl font-extrabold tracking-tight text-[var(--color-text)]'>
              Admin Moderation Login
            </h1>
            <p className='mt-2 text-sm leading-6 text-[var(--color-text-secondary)]'>
              Access the private moderation queue to review and manage pandal
              listings.
            </p>
          </div>

          {error && (
            <div
              className='mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700'
              role='alert'
            >
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-5' noValidate>
            <div className='space-y-2'>
              <label
                htmlFor='admin-email'
                className='text-sm font-bold text-stone-800'
              >
                Admin Email
              </label>
              <input
                id='admin-email'
                type='email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder='admin@ganeshdarshan.hyderabad'
                required
                autoComplete='email'
                className='w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]'
              />
            </div>

            <div className='space-y-2'>
              <label
                htmlFor='admin-password'
                className='text-sm font-bold text-stone-800'
              >
                Password
              </label>
              <input
                id='admin-password'
                type='password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder='••••••••••••'
                required
                autoComplete='current-password'
                className='w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]'
              />
            </div>

            <button
              type='submit'
              disabled={isLoading}
              className='w-full rounded-full bg-[var(--color-primary)] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60'
              aria-busy={isLoading}
            >
              {isLoading ? '⏳ Verifying…' : 'Sign In to Moderation'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
