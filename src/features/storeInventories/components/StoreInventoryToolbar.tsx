import { FilterXIcon, PlusIcon, SlidersHorizontalIcon } from 'lucide-react'
import { useState, type Ref } from 'react'
import { SearchInput } from '@/components/common/SearchInput'
import { SelectInput } from '@/components/common/SelectInput'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Kbd } from '@/components/ui/kbd'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { INVENTORY_SHORTCUTS, INVENTORY_STATUS_OPTIONS } from '../storeInventories.constants'
import type { InventoryStatusFilter } from '../storeInventories.types'

/** The success-colored button style, from the global theme tokens. */
const APPLY_BUTTON_CLASS = 'bg-success text-success-foreground hover:bg-success/90'

interface StoreInventoryToolbarProps {
  search: string
  onSearch: (search: string) => void
  status: InventoryStatusFilter
  onStatusChange: (status: InventoryStatusFilter) => void
  onAdd: () => void
  /** Lets the page focus the search box from its keyboard shortcut. */
  searchRef?: Ref<HTMLInputElement>
}

/** Search (on Enter), a filter popover whose choice applies on Apply, and the Add product action. */
export function StoreInventoryToolbar({ search, onSearch, status, onStatusChange, onAdd, searchRef }: StoreInventoryToolbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState(status)
  const isFiltered = status !== 'all'

  const handleOpenChange = (open: boolean) => {
    // Every time the popover opens it starts from the filter that's actually applied.
    if (open) setDraft(status)
    setIsOpen(open)
  }

  const apply = (next: InventoryStatusFilter) => {
    onStatusChange(next)
    setIsOpen(false)
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <SearchInput
        value={search}
        onSearch={onSearch}
        placeholder="Search product, SKU or variation, then press Enter"
        label="Search inventory"
        shortcut={INVENTORY_SHORTCUTS.search}
        ref={searchRef}
        className="sm:max-w-md"
      />
      <div className="flex items-center gap-2">
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex-1 sm:flex-none">
              <SlidersHorizontalIcon />
              Filters
              {isFiltered && (
                <Badge variant="secondary" className="tabular-nums">
                  1
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72">
            <form
              onSubmit={(event) => {
                event.preventDefault()
                apply(draft)
              }}
            >
              <FieldGroup className="gap-4">
                <Field>
                  <FieldLabel htmlFor="inventory-filter-status">Status</FieldLabel>
                  <SelectInput
                    id="inventory-filter-status"
                    value={draft}
                    onChange={(next) => setDraft(next as InventoryStatusFilter)}
                    options={INVENTORY_STATUS_OPTIONS}
                  />
                </Field>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="destructive" onClick={() => apply('all')}>
                    Clear
                  </Button>
                  <Button type="submit" className={APPLY_BUTTON_CLASS}>
                    Apply filters
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </PopoverContent>
        </Popover>
        {isFiltered && (
          <Button variant="destructive" onClick={() => onStatusChange('all')}>
            <FilterXIcon />
            Clear filters
          </Button>
        )}
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button className="sm:ml-auto" onClick={onAdd} aria-keyshortcuts={INVENTORY_SHORTCUTS.addProduct}>
            <PlusIcon />
            Add product
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Add product <Kbd>{INVENTORY_SHORTCUTS.addProduct}</Kbd>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
