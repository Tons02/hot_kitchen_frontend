import { XIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import type { SelectOption } from './SelectInput'

interface PickedItemsInputProps {
  value: SelectOption[]
  onChange: (items: SelectOption[]) => void
  /**
   * Renders the picker that adds an item, e.g. a searchable combobox. It gets `add`, which ignores
   * items already picked.
   */
  renderPicker: (add: (item: SelectOption) => void) => ReactNode
  /** What "nothing picked" means here, e.g. "Every product". */
  emptyText: string
  /** e.g. "product", for the remove buttons' labels. */
  itemLabel: string
  disabled?: boolean
}

/**
 * Several picks from a long, searchable list: a picker to add one, and the picks as removable chips.
 * Keeps each pick's label, so the chips never need to look anything up.
 */
export function PickedItemsInput({ value, onChange, renderPicker, emptyText, itemLabel, disabled }: PickedItemsInputProps) {
  const add = (item: SelectOption) => {
    if (!value.some((picked) => picked.value === item.value)) onChange([...value, item])
  }

  return (
    <div className="flex flex-col gap-2">
      {renderPicker(add)}
      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5" aria-label={`Selected ${itemLabel}s`}>
          {value.map((item) => (
            <li key={item.value}>
              <Badge variant="secondary" className="h-7 gap-1 rounded-full pr-1 pl-2.5">
                <span className="max-w-48 truncate">{item.label}</span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(value.filter((picked) => picked.value !== item.value))}
                  className="flex size-5 items-center justify-center rounded-full hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  aria-label={`Remove ${itemLabel} ${String(item.label)}`}
                >
                  <XIcon className="size-3.5" aria-hidden="true" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
