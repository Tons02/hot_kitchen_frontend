import { object, ref, string, type InferType } from 'yup'
import { GENDER_LABELS } from '@/features/users/users.constants'
import { todayIsoDate } from '@/lib/date'

export const loginSchema = object({
  username: string().trim().required('Enter your username.'),
  password: string().required('Enter your password.'),
})

export type LoginFormValues = InferType<typeof loginSchema>

const GENDERS = Object.keys(GENDER_LABELS)

/** Mirrors the API's RegisterRequest. Uniqueness (username, email, mobile) is checked by the API. */
export const registerSchema = object({
  first_name: string().trim().required('Enter your first name.').max(255, 'Keep it under 255 characters.'),
  middle_name: string().trim().max(255, 'Keep it under 255 characters.').default(''),
  last_name: string().trim().required('Enter your last name.').max(255, 'Keep it under 255 characters.'),
  suffix: string().trim().max(20, 'Keep the suffix under 20 characters.').default(''),
  gender: string()
    .required('Select an option.')
    .test('gender', 'Select an option.', (value) => !value || GENDERS.includes(value)),
  date_of_birth: string()
    .required('Enter your date of birth.')
    .test('past', 'Your date of birth must be before today.', (value) => !value || value < todayIsoDate()),
  mobile_number: string()
    .required('Enter your mobile number.')
    .matches(/^\d{10}$/, 'Enter the 10 digits after +63.'),
  email: string().trim().required('Enter your email address.').email('Enter a valid email address.').max(255),
  username: string()
    .trim()
    .required('Choose a username.')
    .min(4, 'Use at least 4 characters.')
    .max(50, 'Keep it under 50 characters.')
    .matches(/^[A-Za-z0-9._-]+$/, 'Use only letters, numbers, dots, dashes and underscores.'),
  password: string()
    .required('Create a password.')
    .min(8, 'Use at least 8 characters.')
    .matches(/[A-Za-z]/, 'Include at least one letter.')
    .matches(/\d/, 'Include at least one number.'),
  password_confirmation: string()
    .required('Type your password again.')
    .oneOf([ref('password')], "The passwords don't match."),
})

export type RegisterFormValues = InferType<typeof registerSchema>
