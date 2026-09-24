import { RefreshCwIcon, TriangleAlertIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/services/api/apiError'
import { EmptyState } from './EmptyState'

interface ErrorStateProps {
  title?: string
  /** An RTK Query error. Converted to a user-friendly message; raw server output is never shown. */
  error?: unknown
  /** Overrides the message derived from `error`. */
  description?: ReactNode
  /** Typically the query's `refetch`. */
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  error,
  description,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <EmptyState
      title={title}
      description={description ?? getErrorMessage(error)}
      icon={TriangleAlertIcon}
      iconClassName="bg-destructive/10 text-destructive"
      className={className}
      action={
        onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCwIcon />
            Try again
          </Button>
        )
      }
    />
  )
}
