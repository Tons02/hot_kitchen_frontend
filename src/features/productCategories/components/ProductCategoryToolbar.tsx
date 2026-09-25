import { FilterXIcon, SlidersHorizontalIcon } from 'lucide-react'
import { useState, type Ref } from 'react'
import { SearchInput } from '@/components/common/SearchInput'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { StoreCombobox } from '@/features/stores/components/StoreCombobox'
import { DEFAULT_PRODUCT_CATEGORY_FILTERS, PRODUCT_CATEGORY_SHORTCUTS } from '../productCategories.constants'
import type { ProductCategoryFilterValues } from '../productCategories.types'
import { countActiveFilters } from '../productCategories.utils'

/** The success-colored button style, from the global theme tokens. */
const APPLY_BUTTON_CLASS = 'bg-success text-success-foreground hover:bg-success/90'

interface ProductCategoryToolbarProps {
  search: string
  onSearch: (search: string) => void
  filters: ProductCategoryFilterValues
  onFiltersChange: (filters: ProductCategoryFilterValues) => void
  /** Lets the page focus the search box from its keyboard shortcut. */
  searchRef?: Ref<HTMLInputElement>
}

/** Search (on Enter) and a filter popover whose choices only apply when you press Apply. */
export function ProductCategoryToolbar({ search, onSearch, filters, onFiltersChange, searchRef }: ProductCategoryToolbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState(filters)
  const activeCount = countActiveFilters(filters)

  const handleOpenChange = (open: boolean) => {
    // Every time the popover opens it starts from the filters that are actually applied.
    if (open) setDraft(filters)
    setIsOpen(open)
  }

  const apply = (next: ProductCategoryFilterValues) => {
    onFiltersChange(next)
    setIsOpen(false)
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <SearchInput
        value={search}
        onSearch={onSearch}
        placeholder="Search name or description, then press Enter"
        label="Search product categories"
        shortcut={PRODUCT_CATEGORY_SHORTCUTS.search}
        ref={searchRef}
        className="sm:max-w-md"
      />
      <div className="flex items-center gap-2">
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex-1 sm:flex-none">
              <SlidersHorizontalIcon />
              Filters
              {activeCount > 0 && (
                <Badge variant="secondary" className="tabular-nums">
                  {activeCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <form
              onSubmit={(event) => {
                event.preventDefault()
                apply(draft)
              }}
            >
              <FieldGroup className="gap-4">
                <Field>
                  <FieldLabel htmlFor="category-filter-store">Store</FieldLabel>
                  <StoreCombobox
                    id="category-filter-store"
                    value={draft.storeId}
                    onChange={(storeId) => setDraft((current) => ({ ...current, storeId }))}
                    allLabel="All stores"
                  />
                </Field>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="destructive" onClick={() => apply(DEFAULT_PRODUCT_CATEGORY_FILTERS)}>
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
        {activeCount > 0 && (
          <Button variant="destructive" onClick={() => onFiltersChange(DEFAULT_PRODUCT_CATEGORY_FILTERS)}>
            <FilterXIcon />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  )
}
