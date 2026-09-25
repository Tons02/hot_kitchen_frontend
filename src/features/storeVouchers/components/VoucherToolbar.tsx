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
import { DISCOUNT_TYPE_OPTIONS, VOUCHER_SHORTCUTS } from '../storeVouchers.constants'

/** The success-colored button style, from the global theme tokens. */
const APPLY_BUTTON_CLASS = 'bg-success text-success-foreground hover:bg-success/90'

interface VoucherToolbarProps {
  search: string
  onSearch: (search: string) => void
  /** 'all' or a discount type. */
  discountType: string
  onDiscountTypeChange: (discountType: string) => void
  /** Hidden in the Archived tab, where nothing is created. */
  onAdd?: () => void
  /** Lets the page focus the search box from its keyboard shortcut. */
  searchRef?: Ref<HTMLInputElement>
}

/** Search (on Enter), a filter popover whose choice applies on Apply, and the Add voucher action. */
export function VoucherToolbar({ search, onSearch, discountType, onDiscountTypeChange, onAdd, searchRef }: VoucherToolbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState(discountType)
  const isFiltered = discountType !== 'all'

  const handleOpenChange = (open: boolean) => {
    // Every time the popover opens it starts from the filter that's actually applied.
    if (open) setDraft(discountType)
    setIsOpen(open)
  }

  const apply = (next: string) => {
    onDiscountTypeChange(next)
    setIsOpen(false)
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <SearchInput
        value={search}
        onSearch={onSearch}
        placeholder="Search code, name or description, then press Enter"
        label="Search vouchers"
        shortcut={VOUCHER_SHORTCUTS.search}
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
                  <FieldLabel htmlFor="voucher-filter-type">Discount type</FieldLabel>
                  <SelectInput
                    id="voucher-filter-type"
                    value={draft}
                    onChange={setDraft}
                    options={[{ value: 'all', label: 'All types' }, ...DISCOUNT_TYPE_OPTIONS]}
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
          <Button variant="destructive" onClick={() => onDiscountTypeChange('all')}>
            <FilterXIcon />
            Clear filters
          </Button>
        )}
      </div>
      {onAdd && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button className="sm:ml-auto" onClick={onAdd} aria-keyshortcuts={VOUCHER_SHORTCUTS.addVoucher}>
              <PlusIcon />
              Add voucher
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Add voucher <Kbd>{VOUCHER_SHORTCUTS.addVoucher}</Kbd>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
