import { useEffect, useState, ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { checkAdminAuth } from '../../services/adminApi'

interface AdminProtectedRouteProps {
  children: ReactNode
}

export function AdminProtectedRoute ({ children }: AdminProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true
    checkAdminAuth().then(res => {
      if (mounted) {
        setIsAuthenticated(res.authenticated)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  if (isAuthenticated === null) {
    return (
      <div className='flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center text-[var(--color-text-secondary)]'>
        <span className='text-5xl opacity-60' aria-hidden='true'>
          🔒
        </span>
        <p className='text-base font-medium'>Verifying admin session…</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to='/admin/login' replace />
  }

  return <>{children}</>
}
