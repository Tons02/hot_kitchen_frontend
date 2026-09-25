import { yupResolver } from '@hookform/resolvers/yup'
import { CopyIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { FormErrorAlert } from '@/components/common/FormErrorAlert'
import { FormField } from '@/components/common/FormField'
import { LoadingButton } from '@/components/common/LoadingButton'
import { ModalBody, ModalFooter } from '@/components/common/Modal'
import { Button } from '@/components/ui/button'
import { DialogClose } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useSingleFlight } from '@/hooks/use-single-flight'
import { applyServerErrors } from '@/lib/form'
import { DAYS_OF_WEEK } from '../stores.constants'
import { operatingHoursSchema, type OperatingHourFormValue, type OperatingHoursFormValues } from '../stores.schemas'
import type { DayOfWeek, OperatingHourPayload, StoreOperatingHour } from '../stores.types'
import { getOperatingHoursFormDefaults, toOperatingHoursPayload } from '../stores.utils'
import { CopyHoursDialog, type CopyHoursSource } from './CopyHoursDialog'
import { OperatingHoursSaveConfirmDialog } from './OperatingHoursSaveConfirmDialog'

interface OperatingHoursFormProps {
  storeName: string
  hours: StoreOperatingHour[]
  /** Saves the week. Reject (e.g. with RTK Query's `.unwrap()`) so the form can show the API's errors. */
  onSubmit: (payload: OperatingHourPayload[]) => Promise<unknown>
}

/**
 * All seven days at once, since the API replaces the whole week in one call. Copying a day's hours
 * asks which days get them; saving first validates, then shows the week for confirmation.
 */
export function OperatingHoursForm({ storeName, hours, onSubmit }: OperatingHoursFormProps) {
  const form = useForm<OperatingHoursFormValues>({
    resolver: yupResolver(operatingHoursSchema),
    defaultValues: getOperatingHoursFormDefaults(hours),
  })
  const { control } = form
  const { isSubmitted, errors } = form.formState
  const week = useWatch({ control, name: 'operating_hours' })

  // The saved week in form shape, by day, for marking what changed. Days without hours aren't in it.
  const saved = useMemo(() => {
    const savedDays = new Set(hours.map((hour) => hour.day_of_week))
    return new Map(
      getOperatingHoursFormDefaults(hours)
        .operating_hours.filter((hour) => savedDays.has(hour.day_of_week as DayOfWeek))
        .map((hour): [DayOfWeek, OperatingHourFormValue] => [hour.day_of_week as DayOfWeek, hour]),
    )
  }, [hours])

  const [copySource, setCopySource] = useState<CopyHoursSource | null>(null)
  const [isCopyOpen, setIsCopyOpen] = useState(false)
  // Remounts the copy dialog on every open, so its day selection starts fresh.
  const [copyKey, setCopyKey] = useState(0)

  const [pendingValues, setPendingValues] = useState<OperatingHoursFormValues | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  /** Opens the copy dialog, but only once the day's own hours are valid, so bad times don't spread. */
  const requestCopy = async (index: number) => {
    const isValid = await form.trigger(`operating_hours.${index}`)
    if (!isValid) return
    const hour = form.getValues(`operating_hours.${index}`)
    setCopySource({ day: hour.day_of_week as DayOfWeek, hour })
    setCopyKey((key) => key + 1)
    setIsCopyOpen(true)
  }

  const applyCopy = (days: DayOfWeek[]) => {
    if (!copySource) return
    const options = { shouldDirty: true, shouldValidate: isSubmitted }
    for (const day of days) {
      const index = DAYS_OF_WEEK.findIndex((option) => option.value === day)
      if (index < 0) continue
      form.setValue(`operating_hours.${index}.is_closed`, copySource.hour.is_closed, options)
      form.setValue(`operating_hours.${index}.open_time`, copySource.hour.open_time, options)
      form.setValue(`operating_hours.${index}.close_time`, copySource.hour.close_time, options)
    }
    setIsCopyOpen(false)
    toast.success(`Copied to ${days.length} day${days.length === 1 ? '' : 's'}.`, { description: 'Save to apply them.' })
  }

  // Ignores a second click that lands before the button has re-rendered as disabled.
  const save = useSingleFlight(async (values: OperatingHoursFormValues) => {
    setIsSaving(true)
    try {
      // On success the parent closes the whole dialog.
      await onSubmit(toOperatingHoursPayload(values))
    } catch (error) {
      // Back to the form, where the API's errors show on the fields they belong to.
      setIsConfirmOpen(false)
      applyServerErrors(error, form.setError)
    } finally {
      setIsSaving(false)
    }
  })

  return (
    // Fills the dialog: the days scroll, the footer stays put.
    <form
      onSubmit={form.handleSubmit((values) => {
        setPendingValues(values)
        setIsConfirmOpen(true)
      })}
      noValidate
      className="flex min-h-0 flex-1 flex-col"
    >
      <ModalBody className="flex flex-col gap-4">
        <FormErrorAlert title="Couldn't save these hours" message={errors.root?.server?.message} />

        <ul className="flex flex-col divide-y rounded-lg border">
          {DAYS_OF_WEEK.map((day, index) => {
            const isClosed = week[index]?.is_closed ?? false
            const switchId = `operating_hours.${index}.is_open`

            return (
              <li key={day.value} className="flex flex-col gap-3 p-4">
                <div className="flex items-center gap-3">
                  <span className="min-w-24 font-medium">{day.label}</span>
                  <Controller
                    control={control}
                    name={`operating_hours.${index}.is_closed`}
                    render={({ field }) => (
                      <div className="flex items-center gap-2">
                        <Switch
                          id={switchId}
                          ref={field.ref}
                          checked={!field.value}
                          onCheckedChange={(isOpen) => field.onChange(!isOpen)}
                          onBlur={field.onBlur}
                        />
                        <Label htmlFor={switchId} className="text-muted-foreground">
                          {field.value ? 'Closed' : 'Open'}
                        </Label>
                      </div>
                    )}
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="ml-auto"
                        aria-label={`Copy ${day.label}'s hours to other days`}
                        onClick={() => void requestCopy(index)}
                      >
                        <CopyIcon />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy to other days</TooltipContent>
                  </Tooltip>
                </div>

                {/* Closed days keep their times in the form, so reopening a day brings them back. */}
                {!isClosed && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={control}
                      name={`operating_hours.${index}.open_time`}
                      label="Opens"
                      render={(field) => <Input {...field} type="time" />}
                    />
                    <FormField
                      control={control}
                      name={`operating_hours.${index}.close_time`}
                      label="Closes"
                      render={(field) => <Input {...field} type="time" />}
                    />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </ModalBody>

      <ModalFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={isSaving}>
            Cancel
          </Button>
        </DialogClose>
        <LoadingButton type="submit" isLoading={isSaving} className="ml-2">
          Save hours
        </LoadingButton>
      </ModalFooter>

      <CopyHoursDialog
        key={copyKey}
        source={copySource}
        open={isCopyOpen}
        onOpenChange={setIsCopyOpen}
        onConfirm={applyCopy}
      />
      <OperatingHoursSaveConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        storeName={storeName}
        saved={saved}
        pending={pendingValues}
        isLoading={isSaving}
        onConfirm={() => pendingValues && void save(pendingValues)}
      />
    </form>
  )
}
