import { useState } from 'react'
import { SearchCombobox, type SearchComboboxFieldProps } from '@/components/common/SearchCombobox'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { COMBOBOX_PAGE_SIZE, getComboboxFooter } from '@/lib/combobox'
import type { Store } from '../stores.types'
import { useGetStoreQuery, useSearchStoresQuery } from '../storesApi'

type StoreComboboxProps = SearchComboboxFieldProps & {
  /** Adds an "all" choice (value 'all') with this label, for filters. */
  allLabel?: string
}

const toLabel = (store: Pick<Store, 'name' | 'code'>) => `${store.name} (${store.code})`

/**
 * Picks a store by searching the API (name, email, mobile or region). Loads 20 matches at a time and
 * only while open, so it stays light however many stores there are. Value = store id as a string.
 */
export function StoreCombobox({ allLabel, placeholder = 'Select store', ...props }: StoreComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  const results = useSearchStoresQuery({ search: debouncedSearch, perPage: COMBOBOX_PAGE_SIZE }, { skip: !isOpen })
  const stores = results.data?.items ?? []
  const options = stores.map((store) => ({ value: String(store.id), label: toLabel(store) }))

  // A chosen store that isn't among the matches (e.g. a saved value) is loaded on its own for its name.
  const selectedId = Number(props.value)
  const needsLabel = Number.isInteger(selectedId) && selectedId > 0 && !options.some((option) => option.value === props.value)
  const selected = useGetStoreQuery(selectedId, { skip: !needsLabel })
  const selectedLabel = selected.data ? toLabel(selected.data) : selected.isError ? `Store #${selectedId}` : 'Loading…'

  return (
    <SearchCombobox
      {...props}
      placeholder={placeholder}
      options={options}
      fixedOptions={allLabel ? [{ value: 'all', label: allLabel }] : []}
      selectedLabel={selectedLabel}
      search={search}
      onSearchChange={setSearch}
      onOpenChange={setIsOpen}
      isLoading={results.isFetching || search !== debouncedSearch}
      isError={results.isError}
      footer={results.data ? getComboboxFooter(stores.length, results.data.total) : undefined}
      searchPlaceholder="Search name, email or region…"
      emptyText="No stores match."
    />
  )
}
