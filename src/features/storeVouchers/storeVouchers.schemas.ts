import { array, boolean, mixed, object, string, type InferType } from 'yup'
import type { SelectOption } from '@/components/common/SelectInput'
import { MAX_AMOUNT, MAX_CODE_LENGTH } from './storeVouchers.constants'
import type { DiscountType } from './storeVouchers.types'

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/
const WHOLE_NUMBER = /^\d+$/

/** An optional peso amount typed as text. */
const optionalAmount = (min: number) =>
  string()
    .trim()
    .default('')
    .matches(AMOUNT_PATTERN, { message: 'Enter an amount like 100 or 99.50.', excludeEmptyString: true })
    .test('range', `Enter an amount from ₱${min} to ₱999,999.99.`, (value) => {
      if (!value) return true
      const amount = Number(value)
      return amount >= min && amount <= MAX_AMOUNT
    })

/** An optional whole count, at least 1. */
const optionalCount = () =>
  string()
    .trim()
    .default('')
    .matches(WHOLE_NUMBER, { message: 'Enter a whole number, e.g. 100.', excludeEmptyString: true })
    .test('min', 'Enter at least 1, or leave it empty for no limit.', (value) => !value || Number(value) >= 1)

/** Picked products or categories, kept with their labels so the chips can name them. */
const pickedItems = () => array(mixed<SelectOption>().required()).default([])

/**
 * Mirrors the API's StoreVoucherRequest. Code uniqueness and whether products belong to the store are
 * checked by the API. Context: `isCreate` (a new voucher's expiry must be in the future) and
 * `usedCount` (the total limit can't drop below uses so far).
 */
export const voucherSchema = object({
  code: string()
    .trim()
    .default('')
    .max(MAX_CODE_LENGTH, `Keep the code under ${MAX_CODE_LENGTH} characters.`)
    .matches(/^[A-Za-z0-9_-]*$/, 'Use only letters, numbers, dashes and underscores.'),
  name: string().trim().required('Enter a name customers will recognize.').max(255, 'Keep it under 255 characters.'),
  description: string().trim().default(''),
  discount_type: string<DiscountType>()
    .oneOf(['percentage', 'fixed_amount', 'free_delivery'], 'Choose a discount type.')
    .required('Choose a discount type.'),
  discount_value: string()
    .trim()
    .default('')
    .when('discount_type', {
      is: 'percentage',
      then: (schema) =>
        schema
          .required('Enter the percentage off.')
          .matches(AMOUNT_PATTERN, 'Enter a number like 10 or 12.5.')
          .test('range', 'Enter a percentage from 0.01 to 100.', (value) => {
            const percent = Number(value)
            return percent >= 0.01 && percent <= 100
          }),
    })
    .when('discount_type', {
      is: 'fixed_amount',
      then: (schema) =>
        schema
          .required('Enter the amount off.')
          .matches(AMOUNT_PATTERN, 'Enter an amount like 50 or 49.50.')
          .test('range', 'Enter an amount from ₱0.01 to ₱999,999.99.', (value) => {
            const amount = Number(value)
            return amount >= 0.01 && amount <= MAX_AMOUNT
          }),
    }),
  min_order_amount: optionalAmount(0),
  max_discount_amount: optionalAmount(0.01),
  total_limit: optionalCount().test('used', function (value) {
    const used = Number(this.options.context?.usedCount ?? 0)
    if (!value || Number(value) >= used) return true
    return this.createError({ message: `It has already been used ${used} times, so the limit can't be lower.` })
  }),
  per_user_limit: optionalCount().test('within-total', 'Keep it at or below the total limit.', function (value) {
    const total: unknown = this.parent.total_limit
    return !value || typeof total !== 'string' || !WHOLE_NUMBER.test(total) || Number(value) <= Number(total)
  }),
  first_order_only: boolean().default(false),
  is_individual_use: boolean().default(true),
  is_active: boolean().default(true),
  /** `datetime-local` values in the user's time zone. */
  starts_at: string().default(''),
  expires_at: string()
    .default('')
    .test('after-start', 'End it after it starts.', function (value) {
      const start: unknown = this.parent.starts_at
      return !value || typeof start !== 'string' || !start || new Date(value) > new Date(start)
    })
    .test('future', 'A new voucher has to end in the future.', function (value) {
      return !value || !this.options.context?.isCreate || new Date(value) > new Date()
    }),
  products: pickedItems(),
  categories: pickedItems(),
})

export type VoucherFormValues = InferType<typeof voucherSchema>
