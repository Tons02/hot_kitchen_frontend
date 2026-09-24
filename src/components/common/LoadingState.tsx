import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  label?: string
  className?: string
}

/**
 * Centered spinner that fills the available space.
 * Prefer `<Skeleton />` placeholders when the shape of the content is known (tables, cards).
 */
export function LoadingState({ label = 'Loading…', className }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-3 p-6 text-sm text-muted-foreground',
        className,
      )}
    >
      <Spinner className="size-6" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
