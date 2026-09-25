import { boolean, object, ref, string, type InferType } from 'yup'
import { ADDRESS_LABELS } from './account.constants'

const MOBILE_DIGITS = /^\d{10}$/

/** Mirrors UpdateProfileRequest. The mobile number's uniqueness is checked by the API. */
export const profileSchema = object({
  first_name: string().trim().required('Enter your first name.').max(255, 'Keep it under 255 characters.'),
  middle_name: string().trim().max(255, 'Keep it under 255 characters.').default(''),
  last_name: string().trim().required('Enter your last name.').max(255, 'Keep it under 255 characters.'),
  suffix: string().trim().max(20, 'Keep the suffix under 20 characters.').default(''),
  mobile_number: string().required('Enter your mobile number.').matches(MOBILE_DIGITS, 'Enter the 10 digits after +63.'),
})

export type ProfileFormValues = InferType<typeof profileSchema>

/** Mirrors ChangePasswordRequest. Whether the current password is right is checked by the API. */
export const passwordSchema = object({
  current_password: string().required('Enter your current password.'),
  password: string()
    .required('Create a new password.')
    .min(8, 'Use at least 8 characters.')
    .matches(/[A-Za-z]/, 'Include at least one letter.')
    .matches(/\d/, 'Include at least one number.')
    .notOneOf([ref('current_password')], 'Choose a password different from your current one.'),
  password_confirmation: string()
    .required('Type the new password again.')
    .oneOf([ref('password')], "The passwords don't match."),
})

export type PasswordFormValues = InferType<typeof passwordSchema>

const LABELS = Object.keys(ADDRESS_LABELS)

function coordinate(label: string, limit: number) {
  return string()
    .trim()
    .required(`Set the ${label}: use your current location or type it in.`)
    .test('number', `Enter the ${label} as a number.`, (value) => !value || Number.isFinite(Number(value)))
    .test('range', `The ${label} must be between -${limit} and ${limit}.`, (value) => {
      const number = Number(value)
      return !value || !Number.isFinite(number) || Math.abs(number) <= limit
    })
}

/** Mirrors UserAddressRequest. */
export const addressSchema = object({
  label: string()
    .required('Choose a label.')
    .test('label', 'Choose a label.', (value) => !value || LABELS.includes(value)),
  recipient_name: string().trim().required('Enter who receives the order.').max(255, 'Keep it under 255 characters.'),
  recipient_phone: string().required('Enter their mobile number.').matches(MOBILE_DIGITS, 'Enter the 10 digits after +63.'),
  address_line: string()
    .trim()
    .required('Enter the house number, street and building.')
    .max(255, 'Keep it under 255 characters.'),
  barangay: string().trim().max(120, 'Keep it under 120 characters.').default(''),
  city: string().trim().required('Enter the city or municipality.').max(120, 'Keep it under 120 characters.'),
  province: string().trim().required('Enter the province.').max(120, 'Keep it under 120 characters.'),
  postal_code: string().trim().max(10, 'Keep it under 10 characters.').default(''),
  latitude: coordinate('latitude', 90),
  longitude: coordinate('longitude', 180),
  delivery_notes: string().trim().max(500, 'Keep it under 500 characters.').default(''),
  is_default: boolean().default(false),
})

export type AddressFormValues = InferType<typeof addressSchema>
