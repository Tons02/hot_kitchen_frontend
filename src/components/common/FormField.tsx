import type { ReactNode } from 'react'
import {
  Controller,
  type Control,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'

export type FormControlProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = ControllerRenderProps<TFieldValues, TName> & {
  id: string
  'aria-invalid': boolean
  'aria-describedby'?: string
}

interface FormFieldProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> {
  control: Control<TFieldValues>
  name: TName
  label: ReactNode
  description?: ReactNode
  /** Adds "(optional)" after the label. */
  optional?: boolean
  /** Renders the input. Spread the props onto it to wire up value, events, ref and accessibility. */
  render: (props: FormControlProps<TFieldValues, TName>) => ReactNode
}

/**
 * A labelled, validated field bound to React Hook Form.
 *
 * <FormField control={form.control} name="email" label="Email"
 *   render={(field) => <Input {...field} type="email" />} />
 */
export function FormField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  control,
  name,
  label,
  description,
  optional = false,
  render,
}: FormFieldProps<TFieldValues, TName>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const descriptionId = description ? `${field.name}-description` : undefined
        const errorId = fieldState.error ? `${field.name}-error` : undefined
        const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>
              {label}
              {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
            </FieldLabel>
            {render({
              ...field,
              id: field.name,
              'aria-invalid': fieldState.invalid,
              'aria-describedby': describedBy,
            })}
            {description && <FieldDescription id={descriptionId}>{description}</FieldDescription>}
            <FieldError id={errorId} errors={[fieldState.error]} />
          </Field>
        )
      }}
    />
  )
}
