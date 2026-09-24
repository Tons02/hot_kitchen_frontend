import type { ReactNode } from 'react'
import { FieldDescription, FieldGroup, FieldLegend, FieldSet } from '@/components/ui/field'

interface FormSectionProps {
  title: string
  description?: ReactNode
  children: ReactNode
}

/** A titled group of related fields in a long form. Separate sections with `<FieldSeparator />`. */
export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <FieldSet>
      <FieldLegend>{title}</FieldLegend>
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldGroup>{children}</FieldGroup>
    </FieldSet>
  )
}
