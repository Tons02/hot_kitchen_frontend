import { useState } from 'react'
import { SearchCombobox, type SearchComboboxFieldProps } from '@/components/common/SearchCombobox'
import type { SelectOption } from '@/components/common/SelectInput'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { COMBOBOX_PAGE_SIZE, getComboboxFooter } from '@/lib/combobox'
import { useGetProductCategoryQuery, useSearchProductCategoriesQuery } from '../productCategoriesApi'

type ProductCategoryComboboxProps = SearchComboboxFieldProps & {
  /** Categories belong to a store: nothing can be picked until this is a store's id. */
  storeId: string
  /** Adds an "all" choice (value 'all') with this label, for filters. */
  allLabel?: string
  /** Adds a "none" choice above the matches, e.g. { value: 'none', label: 'No category' } in forms. */
  noneOption?: SelectOption
  /** Shown for a chosen category the API can't find, e.g. one that has since been archived. */
  fallbackLabel?: string
}

/**
 * Picks one of a store's categories by searching the API (name or description). Loads 20 matches at
 * a time and only while open, so it stays light even with thousands. Value = category id as a string.
 */
export function ProductCategoryCombobox({
  storeId,
  allLabel,
  noneOption,
  fallbackLabel = 'Unavailable category',
  placeholder = 'Select category',
  disabled,
  ...props
}: ProductCategoryComboboxProps) {
  const store = Number(storeId)
  const hasStore = Number.isInteger(store) && store > 0

  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  const results = useSearchProductCategoriesQuery(
    { storeId: store, search: debouncedSearch, perPage: COMBOBOX_PAGE_SIZE },
    { skip: !isOpen || !hasStore },
  )
  const categories = results.data?.items ?? []
  const options = categories.map((category) => ({ value: String(category.id), label: category.name }))

  // A chosen category that isn't among the matches (e.g. a saved value) is loaded on its own for its name.
  const selectedId = Number(props.value)
  const needsLabel = Number.isInteger(selectedId) && selectedId > 0 && !options.some((option) => option.value === props.value)
  const selected = useGetProductCategoryQuery(selectedId, { skip: !needsLabel })
  const selectedLabel = selected.data ? selected.data.name : selected.isError ? fallbackLabel : 'Loading…'

  const fixedOptions = [
    ...(allLabel ? [{ value: 'all', label: allLabel }] : []),
    ...(noneOption ? [noneOption] : []),
  ]

  return (
    <SearchCombobox
      {...props}
      placeholder={hasStore ? placeholder : 'Pick a store first'}
      disabled={disabled || !hasStore}
      options={options}
      fixedOptions={fixedOptions}
      selectedLabel={selectedLabel}
      search={search}
      onSearchChange={setSearch}
      onOpenChange={setIsOpen}
      isLoading={results.isFetching || search !== debouncedSearch}
      isError={results.isError}
      footer={results.data ? getComboboxFooter(categories.length, results.data.total) : undefined}
      searchPlaceholder="Search categories…"
      emptyText="No categories match."
    />
  )
}
