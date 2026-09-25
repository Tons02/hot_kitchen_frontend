import { object, string, type InferType } from 'yup'
import { MAX_QUANTITY } from './storeInventories.constants'

/** A whole, non-negative quantity typed as text. */
function quantity(label: string) {
  return string()
    .trim()
    .matches(/^\d*$/, { message: `Enter the ${label} as a whole number, e.g. 50.`, excludeEmptyString: true })
    .test('max', `Keep the ${label} under ${MAX_QUANTITY.toLocaleString()}.`, (value) => !value || Number(value) <= MAX_QUANTITY)
}

const threshold = quantity('threshold').default('')

/**
 * Mirrors StoreInventoryRequest on create, plus the controller's duplicate check.
 * Context: `hasVariations` is true when the chosen product has variations, so one must be picked;
 * `isFullyStocked` is true when the product (or every variation) already has a record at the store.
 */
export const addInventorySchema = object({
  product_id: string()
    .required('Select a product.')
    .test('not-stocked', 'This product is already in the store’s inventory. Edit it instead.', function () {
      return this.options.context?.isFullyStocked !== true
    }),
  variation_id: string()
    .default('')
    .when('$hasVariations', {
      is: true,
      then: (schema) => schema.required('This product has variations. Select which one to stock.'),
    }),
  stock_quantity: quantity('initial stock').required('Enter the initial stock.'),
  low_stock_threshold: threshold,
})

export type AddInventoryFormValues = InferType<typeof addInventorySchema>

/**
 * Mirrors StoreInventoryRequest on update, plus the controller's rule that stock can't go below
 * what's reserved. Context: `reserved` is the record's reserved quantity.
 */
export const editInventorySchema = object({
  stock_quantity: quantity('stock')
    .required('Enter the current stock.')
    .test('reserved', function (value) {
      const reserved = Number(this.options.context?.reserved ?? 0)
      if (!value || Number(value) >= reserved) return true
      return this.createError({
        message: `Stock can't be lower than the ${reserved} reserved for open orders.`,
      })
    }),
  low_stock_threshold: threshold,
})

export type EditInventoryFormValues = InferType<typeof editInventorySchema>
