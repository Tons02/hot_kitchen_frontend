import { CircleAlertIcon, CircleCheckIcon, ClockIcon } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import type { ImageSaveStatus } from '@/lib/layered-images'

/** Covers an image while the form saves it: waiting, uploading, saved or failed. */
export function ImageStepStatus({ status }: { status: ImageSaveStatus | undefined }) {
  if (!status) return null

  if (status === 'working') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-background/75 text-xs font-medium text-foreground">
        <Spinner className="size-6" />
        Uploading…
      </div>
    )
  }

  const badge = {
    pending: { icon: ClockIcon, label: 'Waiting', className: 'bg-background/90 text-muted-foreground' },
    done: { icon: CircleCheckIcon, label: 'Saved', className: 'bg-success text-success-foreground' },
    failed: { icon: CircleAlertIcon, label: 'Failed', className: 'border border-destructive bg-background text-destructive' },
  }[status]
  const Icon = badge.icon

  return (
    <span
      className={cn(
        'absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs font-medium',
        badge.className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {badge.label}
    </span>
  )
}
