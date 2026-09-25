import { array, boolean, mixed, object, string, type InferType } from 'yup'
import { getLayeredImageDraftFiles, type LayeredImageDraft } from '@/lib/layered-images'
import { MAX_PREPARATION_MINUTES, MAX_PRICE, MAX_PRODUCT_IMAGE_BYTES, PRODUCT_IMAGE_TYPES } from './products.constants'

const isAllowedImage = (file: File) => (PRODUCT_IMAGE_TYPES as readonly string[]).includes(file.type)

/** A peso amount typed as text, e.g. "100" or "99.50". */
function price(label: string) {
  return string()
    .trim()
    .required(`Enter the ${label}.`)
    .matches(/^\d+(\.\d{1,2})?$/, 'Enter an amount like 100 or 99.50.')
    .test('max', `Keep the ${label} at ₱999,999.99 or less.`, (value) => !value || Number(value) <= MAX_PRICE)
}

/** Flags every row whose name repeats an earlier one (case-insensitive), like the API's `distinct` rule. */
function uniqueNames<T extends { name?: string }>(rows: T[] | undefined, path: string, noun: string) {
  const seen = new Set<string>()
  for (const [index, row] of (rows ?? []).entries()) {
    const name = row.name?.trim().toLowerCase()
    if (!name) continue
    if (seen.has(name)) return { path: `${path}[${index}].name`, message: `Another ${noun} already has this name.` }
    seen.add(name)
  }
  return null
}

/**
 * `record_id` is the saved row's id ('' for a new row). It isn't called `id` because React Hook
 * Form's field arrays use `id` for their own row keys.
 */
const variationSchema = object({
  record_id: string().default(''),
  name: string().trim().required('Enter a name, e.g. Regular.').max(255, 'Keep it under 255 characters.'),
  price: price('price'),
  sku: string().trim().max(255, 'Keep it under 255 characters.').default(''),
  is_available: boolean().default(true),
})

const addOnSchema = object({
  record_id: string().default(''),
  name: string().trim().required('Enter a name, e.g. Extra Cheese.').max(255, 'Keep it under 255 characters.'),
  price: price('price'),
  is_available: boolean().default(true),
})

/** Mirrors the API's ProductRequest and ProductImageRequest. SKU uniqueness per store is checked by the API. */
export const productSchema = object({
  images: array(mixed<LayeredImageDraft>().required())
    .default([])
    .test('file-type', 'Choose PNG, JPG or WebP images.', (drafts) => !drafts || getLayeredImageDraftFiles(drafts).every(isAllowedImage))
    .test(
      'file-size',
      'Choose images of 10 MB or less.',
      (drafts) => !drafts || getLayeredImageDraftFiles(drafts).every((file) => file.size <= MAX_PRODUCT_IMAGE_BYTES),
    ),
  store_id: string().required('Select a store.'),
  category_id: string().required('Select a category, or No category.'),
  name: string().trim().required('Enter the product name.').max(255, 'Keep it under 255 characters.'),
  description: string().trim().default(''),
  sku: string().trim().max(255, 'Keep it under 255 characters.').default(''),
  base_price: price('base price'),
  preparation_time: string()
    .trim()
    .default('')
    .matches(/^\d*$/, { message: 'Enter whole minutes, e.g. 15.', excludeEmptyString: true })
    .test(
      'max',
      `Keep it at ${MAX_PREPARATION_MINUTES.toLocaleString()} minutes or less.`,
      (value) => !value || Number(value) <= MAX_PREPARATION_MINUTES,
    ),
  is_featured: boolean().default(false),
  is_available: boolean().default(true),
  variations: array(variationSchema)
    .default([])
    .test('distinct', '', function (rows) {
      const duplicate = uniqueNames(rows, this.path, 'variation')
      return duplicate ? this.createError(duplicate) : true
    })
    .test('distinct-sku', '', function (rows) {
      const seen = new Set<string>()
      for (const [index, row] of (rows ?? []).entries()) {
        const sku = row.sku?.trim().toLowerCase()
        if (!sku) continue
        if (seen.has(sku)) return this.createError({ path: `${this.path}[${index}].sku`, message: 'Another variation already has this SKU.' })
        seen.add(sku)
      }
      return true
    }),
  add_ons: array(addOnSchema)
    .default([])
    .test('distinct', '', function (rows) {
      const duplicate = uniqueNames(rows, this.path, 'add-on')
      return duplicate ? this.createError(duplicate) : true
    }),
})

export type ProductFormValues = InferType<typeof productSchema>
export type ProductVariationFormValue = ProductFormValues['variations'][number]
export type ProductAddOnFormValue = ProductFormValues['add_ons'][number]
