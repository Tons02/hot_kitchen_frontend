import { PaperclipIcon, XIcon } from 'lucide-react'
import { useRef, type Ref } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FileInputProps {
  value?: File | null
  onChange: (file: File | null) => void
  /** Passed to the native input, e.g. "image/png,image/jpeg". */
  accept?: string
  /** Shown when no new file is chosen, e.g. the name of the file already on record. */
  placeholder?: string
  id?: string
  name?: string
  onBlur?: () => void
  ref?: Ref<HTMLButtonElement>
  disabled?: boolean
  className?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

/**
 * A controlled file picker. Native file inputs can't be controlled or cleared from state,
 * so the chosen file lives in `value` and the native input is only used to open the picker.
 */
export function FileInput({
  value,
  onChange,
  accept,
  placeholder = 'No file chosen',
  id,
  name,
  onBlur,
  ref,
  disabled,
  className,
  ...ariaProps
}: FileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <Button
        ref={ref}
        id={id}
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onBlur={onBlur}
        {...ariaProps}
      >
        <PaperclipIcon />
        {value ? 'Replace file' : 'Choose file'}
      </Button>
      <span className={cn('min-w-0 truncate text-sm', value ? 'text-foreground' : 'text-muted-foreground')}>
        {value?.name ?? placeholder}
      </span>
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Remove ${value.name}`}
          disabled={disabled}
          onClick={() => onChange(null)}
        >
          <XIcon />
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        hidden
        tabIndex={-1}
        onChange={(event) => {
          onChange(event.target.files?.[0] ?? null)
          // Reset so choosing the same file again still fires a change.
          event.target.value = ''
        }}
      />
    </div>
  )
}
