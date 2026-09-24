import type { ReactNode, Ref } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: ReactNode
}

interface SelectInputProps {
  /** '' shows the placeholder. */
  value: string
  onChange: (value: string) => void
  options: readonly SelectOption[]
  placeholder?: string
  id?: string
  name?: string
  onBlur?: () => void
  ref?: Ref<HTMLButtonElement>
  disabled?: boolean
  className?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
  'aria-label'?: string
}

/**
 * A single-choice select that plugs straight into `<FormField render={(field) => <SelectInput {...field} … />} />`
 * and works just as well uncontrolled by a form (filters).
 */
export function SelectInput({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  name,
  disabled,
  className,
  ...triggerProps
}: SelectInputProps) {
  return (
    <Select value={value} onValueChange={onChange} name={name} disabled={disabled}>
      <SelectTrigger className={cn('w-full', className)} {...triggerProps}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
