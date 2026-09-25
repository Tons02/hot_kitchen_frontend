import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'
import { useState, type Ref } from 'react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import type { SelectOption } from './SelectInput'

export interface SearchComboboxProps {
  /** '' shows the placeholder. */
  value: string
  /** Also gets the chosen option, e.g. to keep its label when collecting several picks. */
  onChange: (value: string, option?: SelectOption) => void
  /** The current page of matches for `search`. The API filters them; the combobox shows them as they are. */
  options: readonly SelectOption[]
  /** Always listed above the matches, e.g. "All stores" or "No category". */
  fixedOptions?: readonly SelectOption[]
  /** The chosen option's label, for when it isn't among the current matches (e.g. a saved value). */
  selectedLabel?: string
  search: string
  onSearchChange: (search: string) => void
  /** Lets the owner load matches only while the list is open. */
  onOpenChange?: (open: boolean) => void
  isLoading?: boolean
  isError?: boolean
  /** Shown under the matches when there are more than the page holds, e.g. "20 of 134 shown". */
  footer?: string
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
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

/** The props a domain picker (e.g. StoreCombobox) takes: the field wiring, without the search plumbing it owns. */
export type SearchComboboxFieldProps = Omit<
  SearchComboboxProps,
  | 'options'
  | 'fixedOptions'
  | 'selectedLabel'
  | 'search'
  | 'onSearchChange'
  | 'onOpenChange'
  | 'isLoading'
  | 'isError'
  | 'footer'
>

/**
 * A searchable single-choice picker whose matches come from the API (shadcn's Combobox: a Popover
 * with a Command list). Drop-in for `<SelectInput>`, including inside `<FormField render>`.
 */
export function SearchCombobox({
  value,
  onChange,
  options,
  fixedOptions = [],
  selectedLabel,
  search,
  onSearchChange,
  onOpenChange,
  isLoading = false,
  isError = false,
  footer,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search…',
  emptyText = 'No matches.',
  id,
  name,
  onBlur,
  ref,
  disabled,
  className,
  ...ariaProps
}: SearchComboboxProps) {
  const [open, setOpen] = useState(false)

  const label =
    [...fixedOptions, ...options].find((option) => option.value === value)?.label ?? (value ? selectedLabel : undefined)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    onOpenChange?.(next)
    // Each opening starts a fresh search.
    if (!next) onSearchChange('')
  }

  const select = (next: SelectOption) => {
    onChange(next.value, next)
    handleOpenChange(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          id={id}
          name={name}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          onBlur={onBlur}
          className={cn('w-full justify-between px-2.5 font-normal aria-invalid:border-destructive', className)}
          {...ariaProps}
        >
          <span className={cn('truncate', !label && 'text-muted-foreground')}>{label ?? placeholder}</span>
          <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-64 p-0">
        {/* The API filters the matches, so cmdk shows them as they are. */}
        <Command shouldFilter={false}>
          <CommandInput value={search} onValueChange={onSearchChange} placeholder={searchPlaceholder} />
          <CommandList>
            {fixedOptions.length > 0 && (
              <CommandGroup>
                {fixedOptions.map((option) => (
                  <ComboboxItem key={option.value} option={option} isSelected={option.value === value} onSelect={select} />
                ))}
              </CommandGroup>
            )}
            {isLoading ? (
              <div role="status" className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Spinner className="size-4" />
                Searching…
              </div>
            ) : isError ? (
              <p role="alert" className="py-6 text-center text-sm text-destructive">
                Couldn't load the list. Close it and try again.
              </p>
            ) : (
              <>
                <CommandEmpty>{emptyText}</CommandEmpty>
                {options.length > 0 && (
                  <CommandGroup>
                    {options.map((option) => (
                      <ComboboxItem key={option.value} option={option} isSelected={option.value === value} onSelect={select} />
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
          {footer && !isLoading && (
            <p className="border-t px-3 py-2 text-xs text-muted-foreground">{footer}</p>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function ComboboxItem({
  option,
  isSelected,
  onSelect,
}: {
  option: SelectOption
  isSelected: boolean
  onSelect: (option: SelectOption) => void
}) {
  return (
    <CommandItem value={option.value} onSelect={() => onSelect(option)}>
      <CheckIcon className={cn('size-4', isSelected ? 'opacity-100' : 'opacity-0')} aria-hidden="true" />
      <span className="truncate">{option.label}</span>
    </CommandItem>
  )
}
