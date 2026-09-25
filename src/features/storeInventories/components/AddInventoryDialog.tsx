import { yupResolver } from '@hookform/resolvers/yup'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { FormErrorAlert } from '@/components/common/FormErrorAlert'
import { FormField } from '@/components/common/FormField'
import { LoadingButton } from '@/components/common/LoadingButton'
import { ModalBody, ModalContent, ModalFooter, ModalHeader } from '@/components/common/Modal'
import { SelectInput } from '@/components/common/SelectInput'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductCombobox } from '@/features/products/components/ProductCombobox'
import { ProductThumbnail } from '@/features/products/components/ProductThumbnail'
import { getProductPriceLabel } from '@/features/products/products.utils'
import { useGetProductQuery } from '@/features/products/productsApi'
import { useSingleFlight } from '@/hooks/use-single-flight'
import { applyServerErrors } from '@/lib/form'
import { formatPeso } from '@/lib/money'
import { addInventorySchema, type AddInventoryFormValues } from '../storeInventories.schemas'
import { ADD_INVENTORY_DEFAULTS, getStockableOptions, toCreateInventoryPayload } from '../storeInventories.utils'
import { useCreateStoreInventoryMutation, useGetProductInventoriesQuery } from '../storeInventoriesApi'

interface AddInventoryDialogProps {
  storeId: number
  storeName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddInventoryDialog({ storeId, storeName, open, onOpenChange }: AddInventoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-lg">
        <ModalHeader title="Add product to inventory" description={`Stock a product at ${storeName}.`} />
        {/* Remounted per store and per opening, so the form always starts empty. */}
        {open && (
          <AddInventoryForm key={storeId} storeId={storeId} storeName={storeName} onDone={() => onOpenChange(false)} />
        )}
      </ModalContent>
    </Dialog>
  )
}

function AddInventoryForm({ storeId, storeName, onDone }: { storeId: number; storeName: string; onDone: () => void }) {
  const [createInventory] = useCreateStoreInventoryMutation()

  // Mirrors the product field: the schema needs what the product can still be stocked as, as context
  // that's read on every render, before the form's own values are available to watch.
  const [productId, setProductId] = useState('')
  const selectedId = Number(productId)
  const hasProduct = selectedId > 0
  // The product with its variations and images, and its records here (at most one per variation).
  const productQuery = useGetProductQuery(selectedId, { skip: !hasProduct })
  const recordsQuery = useGetProductInventoriesQuery({ storeId, productId: selectedId }, { skip: !hasProduct })
  const product = productQuery.data
  const isCheckingProduct = hasProduct && (productQuery.isFetching || recordsQuery.isFetching)
  const stockable = getStockableOptions(product, recordsQuery.data ?? [])

  const form = useForm<AddInventoryFormValues>({
    resolver: yupResolver(addInventorySchema),
    defaultValues: ADD_INVENTORY_DEFAULTS,
    context: { hasVariations: stockable.hasVariations, isFullyStocked: !isCheckingProduct && stockable.isFullyStocked },
  })
  const { control } = form
  const { errors } = form.formState
  const variationId = useWatch({ control, name: 'variation_id' })
  const variation = stockable.variations.find((item) => String(item.id) === variationId)

  const [pendingValues, setPendingValues] = useState<AddInventoryFormValues | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Ignores a second click that lands before the button has re-rendered as disabled.
  const save = useSingleFlight(async (values: AddInventoryFormValues) => {
    setIsSaving(true)
    try {
      const created = await createInventory({ storeId, payload: toCreateInventoryPayload(values) }).unwrap()
      toast.success(`${created.product?.name ?? 'The product'} was added to ${storeName}'s inventory.`)
      onDone()
    } catch (error) {
      // Back to the form, where the API's message shows (e.g. the record already exists).
      setIsConfirmOpen(false)
      applyServerErrors(error, form.setError)
    } finally {
      setIsSaving(false)
    }
  })

  const pendingName = product ? (variation ? `${product.name} (${variation.name})` : product.name) : ''

  return (
    <form
      onSubmit={form.handleSubmit((values) => {
        setPendingValues(values)
        setIsConfirmOpen(true)
      })}
      noValidate
      className="flex min-h-0 flex-1 flex-col"
    >
      <ModalBody className="flex flex-col gap-5">
        <FormErrorAlert title="Couldn't add this product" message={errors.root?.server?.message} />

        <FormField
          control={control}
          name="product_id"
          label="Product"
          description={
            !isCheckingProduct && stockable.isFullyStocked
              ? stockable.hasVariations
                ? 'Every variation of this product is already stocked here. Edit them from the table.'
                : 'This product is already stocked here. Edit it from the table.'
              : 'Search this store’s products by name or SKU.'
          }
          render={({ onChange, ...field }) => (
            <ProductCombobox
              {...field}
              storeId={storeId}
              onChange={(value) => {
                onChange(value)
                setProductId(value)
                // Variations belong to one product, so a new product starts without one.
                form.setValue('variation_id', '')
                form.clearErrors('product_id')
              }}
            />
          )}
        />

        {hasProduct &&
          (product ? (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
              <ProductThumbnail product={product} size="lg" />
              <div className="grid min-w-0 leading-tight">
                <span className="truncate font-medium">{product.name}</span>
                <span className="truncate text-xs text-muted-foreground">{product.sku ? `SKU ${product.sku}` : 'No SKU'}</span>
                <span className="text-sm tabular-nums">
                  {variation ? formatPeso(variation.price) : getProductPriceLabel(product)}
                </span>
              </div>
            </div>
          ) : (
            <Skeleton className="h-18 rounded-lg" />
          ))}

        {stockable.hasVariations && !stockable.isFullyStocked && (
          <FormField
            control={control}
            name="variation_id"
            label="Variation"
            description="Each variation is stocked separately. Variations already stocked aren't listed."
            render={(field) => (
              <SelectInput
                {...field}
                options={stockable.variations.map((item) => ({
                  value: String(item.id),
                  label: `${item.name} · ${formatPeso(item.price)}`,
                }))}
                placeholder="Select variation"
              />
            )}
          />
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={control}
            name="stock_quantity"
            label="Initial stock"
            render={(field) => <Input {...field} inputMode="numeric" placeholder="0" />}
          />
          <FormField
            control={control}
            name="low_stock_threshold"
            label="Low-stock threshold"
            optional
            description="Flag it as low stock at or below this many available."
            render={(field) => <Input {...field} inputMode="numeric" placeholder="10" />}
          />
        </div>
      </ModalBody>

      <ModalFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={isSaving}>
            Cancel
          </Button>
        </DialogClose>
        <LoadingButton type="submit" isLoading={isSaving} disabled={isCheckingProduct} className="ml-2">
          Add product
        </LoadingButton>
      </ModalFooter>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Add to inventory?"
        description={`${pendingName} will be stocked at ${storeName}.`}
        confirmLabel="Yes, add product"
        isLoading={isSaving}
        onConfirm={() => pendingValues && void save(pendingValues)}
      >
        {pendingValues && (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>Initial stock: {Number(pendingValues.stock_quantity).toLocaleString()}</li>
            <li>
              {pendingValues.low_stock_threshold
                ? `Low stock at ${Number(pendingValues.low_stock_threshold).toLocaleString()} available or fewer`
                : 'No low-stock threshold, so it never shows as low stock'}
            </li>
          </ul>
        )}
      </ConfirmDialog>
    </form>
  )
}
