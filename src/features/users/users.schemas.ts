import { mixed, object, string, type InferType } from 'yup'
import { todayIsoDate } from '@/lib/date'
import {
  GENDER_LABELS,
  MAX_UPLOAD_BYTES,
  PROFILE_PICTURE_TYPES,
  PROOF_OF_LICENSE_TYPES,
  STAFF_ROLES,
  VEHICLE_TYPE_LABELS,
} from './users.constants'
import { isStoreBoundRole } from './users.utils'

const GENDERS = Object.keys(GENDER_LABELS)
const VEHICLE_TYPES = Object.keys(VEHICLE_TYPE_LABELS)

/** Select values are plain strings in the form, with '' meaning "nothing chosen yet". */
function isOneOf(values: readonly string[]) {
  return (value: string | undefined) => !value || values.includes(value)
}

function optionalFile(types: readonly string[], typeMessage: string) {
  return mixed<File>()
    .nullable()
    .default(null)
    .test('file-type', typeMessage, (file) => !file || types.includes(file.type))
    .test('file-size', 'Choose a file of 10 MB or less.', (file) => !file || file.size <= MAX_UPLOAD_BYTES)
}

/**
 * Mirrors the API's UserRequest.
 * Context: `hasProofOfLicense` is true when editing a rider who already has a license on file.
 */
export const userSchema = object({
  profile_picture: optionalFile(PROFILE_PICTURE_TYPES, 'Choose a PNG, JPG or WebP image.'),
  first_name: string().trim().required('Enter a first name.').max(255, 'Keep it under 255 characters.'),
  middle_name: string().trim().max(255, 'Keep it under 255 characters.').default(''),
  last_name: string().trim().required('Enter a last name.').max(255, 'Keep it under 255 characters.'),
  suffix: string().trim().max(20, 'Keep the suffix under 20 characters.').default(''),
  gender: string().required('Select a gender.').test('gender', 'Select a gender.', isOneOf(GENDERS)),
  date_of_birth: string()
    .required('Enter a date of birth.')
    .test('in-past', 'Date of birth must be in the past.', (value) => !value || value < todayIsoDate()),
  mobile_number: string()
    .required('Enter a mobile number.')
    .matches(/^\d{10}$/, 'Enter the 10 digits after +63.'),
  username: string()
    .trim()
    .required('Enter a username.')
    .max(255, 'Keep it under 255 characters.')
    .matches(/^\S+$/, "Usernames can't contain spaces."),
  email: string()
    .trim()
    .required('Enter an email address.')
    .email('Enter a valid email address.')
    .max(255, 'Keep it under 255 characters.'),
  role: string().required('Select a role.').test('role', 'Select a role.', isOneOf(STAFF_ROLES)),
  store_id: string()
    .default('')
    .when('role', ([role], schema) =>
      isStoreBoundRole(role) ? schema.required('Select the store this user works at.') : schema,
    ),
  vehicle_type: string()
    .default('')
    .when('role', ([role], schema) =>
      role === 'delivery_rider'
        ? schema.required('Select a vehicle type.').test('vehicle', 'Select a vehicle type.', isOneOf(VEHICLE_TYPES))
        : schema,
    ),
  vehicle_brand: string()
    .trim()
    .max(255, 'Keep it under 255 characters.')
    .default('')
    .when('role', ([role], schema) => (role === 'delivery_rider' ? schema.required('Enter the vehicle brand.') : schema)),
  plate_number: string().trim().max(30, 'Keep the plate number under 30 characters.').default(''),
  license_number: string()
    .trim()
    .max(30, 'Keep the license number under 30 characters.')
    .default('')
    .when('role', ([role], schema) =>
      role === 'delivery_rider' ? schema.required("Enter the driver's license number.") : schema,
    ),
  proof_of_license: optionalFile(PROOF_OF_LICENSE_TYPES, 'Choose an image (PNG, JPG, WebP) or a PDF.').when(
    ['role', '$hasProofOfLicense'],
    ([role, hasProofOfLicense], schema) =>
      role === 'delivery_rider' && !hasProofOfLicense
        ? schema.required("Upload a photo or scan of the driver's license.")
        : schema,
  ),
})

export type UserFormValues = InferType<typeof userSchema>

export const deactivateUserSchema = object({
  deactivate_reason: string()
    .trim()
    .required('Enter a reason for deactivating this user.')
    .max(255, 'Keep the reason under 255 characters.'),
})

export type DeactivateUserFormValues = InferType<typeof deactivateUserSchema>
