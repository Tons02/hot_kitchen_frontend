import { useState } from 'react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { DAYS_OF_WEEK } from '../stores.constants'
import type { OperatingHourFormValue } from '../stores.schemas'
import type { DayOfWeek } from '../stores.types'
import { formatOperatingHourValue } from '../stores.utils'

const WEEKDAYS: readonly DayOfWeek[] = [1, 2, 3, 4, 5]
const WEEKEND: readonly DayOfWeek[] = [6, 7]

export interface CopyHoursSource {
  day: DayOfWeek
  hour: OperatingHourFormValue
}

interface CopyHoursDialogProps {
  /** Kept after closing so the text doesn't blank out during the exit animation. */
  source: CopyHoursSource | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (days: DayOfWeek[]) => void
}

/**
 * Asks which days get the source day's hours before copying them. Every other day starts selected.
 * Remount it (via `key`) each time it opens so the selection starts fresh.
 */
export function CopyHoursDialog({ source, open, onOpenChange, onConfirm }: CopyHoursDialogProps) {
  const sourceDay = DAYS_OF_WEEK.find((day) => day.value === source?.day)
  const otherDays = DAYS_OF_WEEK.filter((day) => day.value !== source?.day)
  const [selected, setSelected] = useState<ReadonlySet<DayOfWeek>>(() => new Set(otherDays.map((day) => day.value)))

  const toggle = (day: DayOfWeek, isChecked: boolean) =>
    setSelected((current) => {
      const next = new Set(current)
      if (isChecked) next.add(day)
      else next.delete(day)
      return next
    })

  const selectOnly = (days: readonly DayOfWeek[]) =>
    setSelected(new Set(days.filter((day) => day !== source?.day)))

  const count = selected.size

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Copy ${sourceDay?.label ?? ''}'s hours?`}
      description={
        <>
          The days you pick get <span className="font-medium text-foreground">
            {source ? formatOperatingHourValue(source.hour) : ''}
          </span>
          . Nothing is saved until you save the hours.
        </>
      }
      confirmLabel={count === 0 ? 'Copy' : `Copy to ${count} day${count === 1 ? '' : 's'}`}
      confirmDisabled={count === 0}
      onConfirm={() => onConfirm(DAYS_OF_WEEK.map((day) => day.value).filter((day) => selected.has(day)))}
    >
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => selectOnly(WEEKDAYS)}>
          Weekdays
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => selectOnly(WEEKEND)}>
          Weekend
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => selectOnly(otherDays.map((day) => day.value))}>
          All
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => selectOnly([])}>
          None
        </Button>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {otherDays.map((day) => {
          const id = `copy-hours-${day.value}`
          return (
            <li key={day.value} className="flex items-center gap-2">
              <Checkbox
                id={id}
                checked={selected.has(day.value)}
                onCheckedChange={(checked) => toggle(day.value, checked === true)}
              />
              <Label htmlFor={id}>{day.label}</Label>
            </li>
          )
        })}
      </ul>
    </ConfirmDialog>
  )
}
