import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { DAYS_OF_WEEK } from '../stores.constants'
import type { OperatingHourFormValue, OperatingHoursFormValues } from '../stores.schemas'
import type { DayOfWeek } from '../stores.types'
import { formatOperatingHourValue, isOperatingHourChanged } from '../stores.utils'

interface OperatingHoursSaveConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  storeName: string
  /** What's saved now, by day. Days missing here count as new. */
  saved: ReadonlyMap<DayOfWeek, OperatingHourFormValue>
  /** Null while there's nothing to confirm (the dialog keeps its last text while closing). */
  pending: OperatingHoursFormValues | null
  isLoading: boolean
  onConfirm: () => void
}

/** The last check before saving: the whole week as it will be, with changed days marked. */
export function OperatingHoursSaveConfirmDialog({
  open,
  onOpenChange,
  storeName,
  saved,
  pending,
  isLoading,
  onConfirm,
}: OperatingHoursSaveConfirmDialogProps) {
  const days = (pending?.operating_hours ?? []).map((hour, index) => ({
    label: DAYS_OF_WEEK[index]?.label ?? '',
    hours: formatOperatingHourValue(hour),
    isClosed: hour.is_closed,
    isChanged: isOperatingHourChanged(saved.get(hour.day_of_week as DayOfWeek), hour),
  }))
  const changedCount = days.filter((day) => day.isChanged).length

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Save these hours?"
      description={
        changedCount === 0
          ? `Nothing changed. Saving keeps ${storeName}'s current week.`
          : `${storeName}'s week will look like this. ${changedCount} day${changedCount === 1 ? '' : 's'} changed.`
      }
      confirmLabel="Yes, save hours"
      isLoading={isLoading}
      onConfirm={onConfirm}
    >
      <dl className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-2 text-sm">
        {days.map((day) => (
          <div key={day.label} className="contents">
            <dt className={cn(day.isChanged ? 'font-medium' : 'text-muted-foreground')}>{day.label}</dt>
            <dd className={cn('tabular-nums', day.isClosed && 'text-muted-foreground')}>{day.hours}</dd>
            <dd>{day.isChanged && <Badge variant="secondary">Changed</Badge>}</dd>
          </div>
        ))}
      </dl>
    </ConfirmDialog>
  )
}
