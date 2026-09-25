import { mixed, object, string, type InferType } from 'yup'
import { CATEGORY_IMAGE_TYPES, MAX_CATEGORY_IMAGE_BYTES } from './productCategories.constants'

/** Mirrors the API's ProductCategoryRequest. The name must also be unique per store, which only the API can check. */
export const productCategorySchema = object({
  image: mixed<File>()
    .nullable()
    .default(null)
    .test(
      'file-type',
      'Choose a PNG, JPG or WebP image.',
      (file) => !file || (CATEGORY_IMAGE_TYPES as readonly string[]).includes(file.type),
    )
    .test('file-size', 'Choose an image of 10 MB or less.', (file) => !file || file.size <= MAX_CATEGORY_IMAGE_BYTES),
  store_id: string().required('Select a store.'),
  name: string().trim().required('Enter a category name.').max(255, 'Keep it under 255 characters.'),
  description: string().trim().default(''),
})

export type ProductCategoryFormValues = InferType<typeof productCategorySchema>
