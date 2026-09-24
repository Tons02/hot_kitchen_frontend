import { array, mixed, object, string, type InferType } from 'yup'
import { MAX_STORE_IMAGE_BYTES, STORE_IMAGE_TYPES } from './stores.constants'
import type { BackgroundImageDraft } from './stores.types'

const IMAGE_TYPE_MESSAGE = 'Choose a PNG, JPG or WebP image.'
const IMAGE_SIZE_MESSAGE = 'Choose an image of 10 MB or less.'

const isAllowedImage = (file: File) => (STORE_IMAGE_TYPES as readonly string[]).includes(file.type)

/** The files the drafts would upload: new images and replacements. */
function getDraftFiles(drafts: BackgroundImageDraft[]): File[] {
  return drafts.flatMap((draft) => {
    if (draft.kind === 'new') return [draft.file]
    return draft.replacement ? [draft.replacement] : []
  })
}

function coordinate(label: string, limit: number) {
  return string()
    .trim()
    .required(`Enter the ${label}.`)
    .test('number', `Enter the ${label} as a number, e.g. ${limit === 90 ? '14.5211990' : '121.0650720'}.`, (value) =>
      !value || Number.isFinite(Number(value)),
    )
    .test('range', `The ${label} must be between -${limit} and ${limit}.`, (value) => {
      const number = Number(value)
      return !value || !Number.isFinite(number) || Math.abs(number) <= limit
    })
}

/** Mirrors the API's StoreRequest, plus the image fields (StoreLogoRequest / StoreBackgroundImageRequest). */
export const storeSchema = object({
  logo: mixed<File>()
    .nullable()
    .default(null)
    .test('file-type', IMAGE_TYPE_MESSAGE, (file) => !file || isAllowedImage(file))
    .test('file-size', IMAGE_SIZE_MESSAGE, (file) => !file || file.size <= MAX_STORE_IMAGE_BYTES),
  background_images: array(mixed<BackgroundImageDraft>().required())
    .default([])
    .test('file-type', IMAGE_TYPE_MESSAGE, (drafts) => !drafts || getDraftFiles(drafts).every(isAllowedImage))
    .test(
      'file-size',
      IMAGE_SIZE_MESSAGE,
      (drafts) => !drafts || getDraftFiles(drafts).every((file) => file.size <= MAX_STORE_IMAGE_BYTES),
    ),
  code: string().trim().required('Enter a store code.').max(50, 'Keep the code under 50 characters.'),
  name: string().trim().required('Enter the store name.').max(255, 'Keep it under 255 characters.'),
  title_banner: string().trim().required('Enter a banner title.').max(255, 'Keep it under 255 characters.'),
  description_banner: string().trim().required('Enter a banner description.'),
  region: string().trim().required('Enter the region.').max(120, 'Keep it under 120 characters.'),
  province: string().trim().required('Enter the province.').max(120, 'Keep it under 120 characters.'),
  city: string().trim().required('Enter the city or municipality.').max(120, 'Keep it under 120 characters.'),
  barangay: string().trim().required('Enter the barangay.').max(120, 'Keep it under 120 characters.'),
  street_name: string().trim().required('Enter the street.').max(255, 'Keep it under 255 characters.'),
  postal_code: string().trim().required('Enter the postal code.').max(10, 'Keep it under 10 characters.'),
  latitude: coordinate('latitude', 90),
  longitude: coordinate('longitude', 180),
  mobile_number: string()
    .required('Enter a mobile number.')
    .matches(/^\d{10}$/, 'Enter the 10 digits after +63.'),
  email: string()
    .trim()
    .required('Enter an email address.')
    .email('Enter a valid email address.')
    .max(255, 'Keep it under 255 characters.'),
})

export type StoreFormValues = InferType<typeof storeSchema>
