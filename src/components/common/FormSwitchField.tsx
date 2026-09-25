import type { ReactNode } from 'react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface FormSwitchFieldProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> {
  control: Control<TFieldValues>
  /** A boolean field. */
  name: TName
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
}

/**
 * A labelled on/off setting bound to React Hook Form: label and description on the left, the switch on
 * the right. For settings like "Available" or "Active", where a checkbox would read as consent.
 */
export function FormSwitchField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  control,
  name,
  label,
  description,
  disabled,
}: FormSwitchFieldProps<TFieldValues, TName>) {
  const descriptionId = description ? `${name}-description` : undefined

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex items-start justify-between gap-4">
          <div className="grid gap-1">
            <Label htmlFor={name}>{label}</Label>
            {description && (
              <p id={descriptionId} className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <Switch
            id={name}
            ref={field.ref}
            checked={Boolean(field.value)}
            onCheckedChange={field.onChange}
            onBlur={field.onBlur}
            disabled={disabled}
            aria-describedby={descriptionId}
          />
        </div>
      )}
    />
  )
}
