import { FilterXIcon, SlidersHorizontalIcon } from 'lucide-react'
import { useState, type Ref } from 'react'
import { SearchInput } from '@/components/common/SearchInput'
import { SelectInput } from '@/components/common/SelectInput'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ProductCategoryCombobox } from '@/features/productCategories/components/ProductCategoryCombobox'
import { StoreCombobox } from '@/features/stores/components/StoreCombobox'
import {
  AVAILABLE_FILTER_OPTIONS,
  DEFAULT_PRODUCT_FILTERS,
  FEATURED_FILTER_OPTIONS,
  PRODUCT_SHORTCUTS,
} from '../products.constants'
import type { ProductFilterValues, ProductListView } from '../products.types'
import { countActiveFilters } from '../products.utils'

/** The success-colored button style, from the global theme tokens. */
const APPLY_BUTTON_CLASS = 'bg-success text-success-foreground hover:bg-success/90'

interface ProductToolbarProps {
  view: ProductListView
  search: string
  onSearch: (search: string) => void
  filters: ProductFilterValues
  onFiltersChange: (filters: ProductFilterValues) => void
  /** Lets the page focus the search box from its keyboard shortcut. */
  searchRef?: Ref<HTMLInputElement>
}

/** Search (on Enter) and a filter popover whose choices only apply when you press Apply. */
export function ProductToolbar({ view, search, onSearch, filters, onFiltersChange, searchRef }: ProductToolbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState(filters)
  const activeCount = countActiveFilters(filters, view)

  const handleOpenChange = (open: boolean) => {
    // Every time the popover opens it starts from the filters that are actually applied.
    if (open) setDraft(filters)
    setIsOpen(open)
  }

  const apply = (next: ProductFilterValues) => {
    onFiltersChange(next)
    setIsOpen(false)
  }

  const setDraftField = (patch: Partial<ProductFilterValues>) => setDraft((current) => ({ ...current, ...patch }))

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <SearchInput
        value={search}
        onSearch={onSearch}
        placeholder="Search name, SKU or description, then press Enter"
        label="Search products"
        shortcut={PRODUCT_SHORTCUTS.search}
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
                  <FieldLabel htmlFor="product-filter-store">Store</FieldLabel>
                  <StoreCombobox
                    id="product-filter-store"
                    value={draft.storeId}
                    // A category only makes sense within its store, so changing the store clears it.
                    onChange={(storeId) => setDraftField({ storeId, categoryId: 'all' })}
                    allLabel="All stores"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="product-filter-category">Category</FieldLabel>
                  <ProductCategoryCombobox
                    id="product-filter-category"
                    storeId={draft.storeId === 'all' ? '' : draft.storeId}
                    value={draft.categoryId}
                    onChange={(categoryId) => setDraftField({ categoryId })}
                    allLabel="All categories"
                  />
                  {draft.storeId === 'all' && <FieldDescription>Pick a store to filter by its categories.</FieldDescription>}
                </Field>
                <Field>
                  <FieldLabel htmlFor="product-filter-featured">Featured</FieldLabel>
                  <SelectInput
                    id="product-filter-featured"
                    value={draft.featured}
                    onChange={(featured) => setDraftField({ featured })}
                    options={FEATURED_FILTER_OPTIONS}
                  />
                </Field>
                {view === 'current' && (
                  <Field>
                    <FieldLabel htmlFor="product-filter-available">Availability</FieldLabel>
                    <SelectInput
                      id="product-filter-available"
                      value={draft.available}
                      onChange={(available) => setDraftField({ available })}
                      options={AVAILABLE_FILTER_OPTIONS}
                    />
                  </Field>
                )}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="destructive" onClick={() => apply(DEFAULT_PRODUCT_FILTERS)}>
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
          <Button variant="destructive" onClick={() => onFiltersChange(DEFAULT_PRODUCT_FILTERS)}>
            <FilterXIcon />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  )
}
