import { useState } from 'react'
import { SearchCombobox, type SearchComboboxFieldProps } from '@/components/common/SearchCombobox'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { COMBOBOX_PAGE_SIZE, getComboboxFooter } from '@/lib/combobox'
import type { Product } from '../products.types'
import { useGetProductQuery, useSearchProductsQuery } from '../productsApi'

type ProductComboboxProps = SearchComboboxFieldProps & {
  /** Products belong to a store: only this store's are searched. */
  storeId: number
}

const toLabel = (product: Pick<Product, 'name' | 'sku'>) => (product.sku ? `${product.name} (${product.sku})` : product.name)

/**
 * Picks one of a store's products by searching the API (name, SKU or description). Loads 20 matches
 * at a time and only while open. Value = product id as a string.
 */
export function ProductCombobox({ storeId, placeholder = 'Select product', ...props }: ProductComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  const results = useSearchProductsQuery(
    { storeId, search: debouncedSearch, perPage: COMBOBOX_PAGE_SIZE },
    { skip: !isOpen },
  )
  const products = results.data?.items ?? []
  const options = products.map((product) => ({ value: String(product.id), label: toLabel(product) }))

  // A chosen product that isn't among the matches is loaded on its own for its name.
  const selectedId = Number(props.value)
  const needsLabel = Number.isInteger(selectedId) && selectedId > 0 && !options.some((option) => option.value === props.value)
  const selected = useGetProductQuery(selectedId, { skip: !needsLabel })
  const selectedLabel = selected.data ? toLabel(selected.data) : selected.isError ? `Product #${selectedId}` : 'Loading…'

  return (
    <SearchCombobox
      {...props}
      placeholder={placeholder}
      options={options}
      selectedLabel={selectedLabel}
      search={search}
      onSearchChange={setSearch}
      onOpenChange={setIsOpen}
      isLoading={results.isFetching || search !== debouncedSearch}
      isError={results.isError}
      footer={results.data ? getComboboxFooter(products.length, results.data.total) : undefined}
      searchPlaceholder="Search name or SKU…"
      emptyText="No products match."
    />
  )
}
