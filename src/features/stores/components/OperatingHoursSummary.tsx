import { StatusBadge } from '@/components/common/StatusBadge'
import { cn } from '@/lib/utils'
import type { StoreOperatingHour } from '../stores.types'
import { hasFullWeekOfHours, summarizeOperatingHours } from '../stores.utils'

/** The week in a few lines, e.g. "Mon–Fri 8:00 AM – 5:00 PM", with closed days muted. */
export function OperatingHoursSummary({ hours, className }: { hours: StoreOperatingHour[] | undefined; className?: string }) {
  if (!hours?.length) return <span className={cn('text-sm text-muted-foreground', className)}>No hours set yet</span>

  return (
    <dl className={cn('grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm', className)}>
      {summarizeOperatingHours(hours).map((line) => (
        <div key={line.days} className="contents">
          <dt className="font-medium">{line.days}</dt>
          <dd className={cn('tabular-nums', line.isClosed && 'text-muted-foreground')}>{line.hours}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Whether the store has hours for the whole week. Customers can't see when a store opens until it does. */
export function OperatingHoursStatusBadge({ hours }: { hours: StoreOperatingHour[] | undefined }) {
  if (hasFullWeekOfHours(hours)) return <StatusBadge tone="success">Set</StatusBadge>
  return <StatusBadge tone="warning">{hours?.length ? 'Incomplete' : 'Not set'}</StatusBadge>
}
