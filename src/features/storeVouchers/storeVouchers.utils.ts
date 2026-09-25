import type { SelectOption } from '@/components/common/SelectInput'
import { formatDateTime, fromDateTimeInputValue, toDateTimeInputValue } from '@/lib/date'
import { formatPeso } from '@/lib/money'
import type { VoucherFormValues } from './storeVouchers.schemas'
import type { DiscountType, StoreVouchersQueryArgs, Voucher, VoucherPayload } from './storeVouchers.types'

/**
 * Query params for `GET /store-vouchers/{store}`. `status` maps to the model's withStatus scope
 * ('archived' to onlyTrashed), `search` to VoucherFilter's code/name/description search.
 */
export function toStoreVouchersParams({ status, search, discountType, page, perPage }: StoreVouchersQueryArgs) {
  const params: Record<string, string | number> = { page, per_page: perPage }
  const term = search.trim()

  if (term) params.search = term
  if (status !== 'all') params.status = status
  if (discountType !== 'all') params.discount_type = discountType

  return params
}

/** What the voucher gives: "20% off, up to ₱100", "₱50 off" or "Free delivery". */
export function formatDiscount(voucher: {
  discount_type: DiscountType
  discount_value: string | number | null
  max_discount_amount?: string | number | null
}): string {
  switch (voucher.discount_type) {
    case 'percentage': {
      const percent = `${Number(voucher.discount_value)}% off`
      return voucher.max_discount_amount ? `${percent}, up to ${formatPeso(voucher.max_discount_amount)}` : percent
    }
    case 'fixed_amount':
      return `${formatPeso(voucher.discount_value ?? 0)} off`
    case 'free_delivery':
      return 'Free delivery'
  }
}

/** "12 of 100 used", or "12 used" when there's no total limit. */
export function formatUsage(voucher: Pick<Voucher, 'used_count' | 'total_limit'>): string {
  return voucher.total_limit === null
    ? `${voucher.used_count.toLocaleString()} used`
    : `${voucher.used_count.toLocaleString()} of ${voucher.total_limit.toLocaleString()} used`
}

/** When it can be used: "Sep 26 – Oct 31", "From Sep 26", "Until Oct 31" or "No end date". */
export function formatValidity(voucher: Pick<Voucher, 'starts_at' | 'expires_at'>): string {
  const { starts_at: start, expires_at: end } = voucher
  if (start && end) return `${formatDateTime(start)} – ${formatDateTime(end)}`
  if (start) return `From ${formatDateTime(start)}`
  if (end) return `Until ${formatDateTime(end)}`
  return 'No end date'
}

/** What the voucher applies to: "Whole menu", or the products and categories it's limited to. */
export function formatScope(products: SelectOption[], categories: SelectOption[]): string {
  if (products.length === 0 && categories.length === 0) return 'Whole menu'
  const names = (items: SelectOption[]) => items.map((item) => String(item.label)).join(', ')
  const parts = [
    categories.length > 0 && `Categories: ${names(categories)}`,
    products.length > 0 && `Products: ${names(products)}`,
  ]
  return parts.filter(Boolean).join(' · ')
}

const toOption = (item: { id: number; name: string; sku?: string | null }) => ({
  value: String(item.id),
  label: item.sku ? `${item.name} (${item.sku})` : item.name,
})

const toAmountText = (value: string | null) => (value === null ? '' : String(Number(value)))
const toCountText = (value: number | null) => (value === null ? '' : String(value))

export function getVoucherFormDefaults(voucher?: Voucher): VoucherFormValues {
  return {
    code: voucher?.code ?? '',
    name: voucher?.name ?? '',
    description: voucher?.description ?? '',
    discount_type: voucher?.discount_type ?? 'percentage',
    discount_value: voucher && voucher.discount_type !== 'free_delivery' ? toAmountText(voucher.discount_value) : '',
    min_order_amount: toAmountText(voucher?.min_order_amount ?? null),
    max_discount_amount: toAmountText(voucher?.max_discount_amount ?? null),
    total_limit: toCountText(voucher?.total_limit ?? null),
    per_user_limit: toCountText(voucher?.per_user_limit ?? null),
    first_order_only: voucher?.first_order_only ?? false,
    is_individual_use: voucher?.is_individual_use ?? true,
    is_active: voucher?.is_active ?? true,
    starts_at: toDateTimeInputValue(voucher?.starts_at),
    expires_at: toDateTimeInputValue(voucher?.expires_at),
    products: (voucher?.products ?? []).map(toOption),
    categories: (voucher?.categories ?? []).map(toOption),
  }
}

const toAmount = (value: string) => (value === '' ? null : Number(value))

/** Converts validated form values into the API payload. Only call with values that passed `voucherSchema`. */
export function toVoucherPayload(values: VoucherFormValues): VoucherPayload {
  const type = values.discount_type
  return {
    code: values.code ? values.code.toUpperCase() : null,
    name: values.name,
    description: values.description || null,
    discount_type: type,
    discount_value: type === 'free_delivery' ? null : toAmount(values.discount_value),
    min_order_amount: toAmount(values.min_order_amount),
    // A cap only makes sense for percentage discounts; the API clears it otherwise.
    max_discount_amount: type === 'percentage' ? toAmount(values.max_discount_amount) : null,
    total_limit: toAmount(values.total_limit),
    per_user_limit: toAmount(values.per_user_limit),
    first_order_only: values.first_order_only,
    is_individual_use: values.is_individual_use,
    is_active: values.is_active,
    starts_at: fromDateTimeInputValue(values.starts_at),
    expires_at: fromDateTimeInputValue(values.expires_at),
    product_ids: values.products.map((item) => Number(item.value)),
    category_ids: values.categories.map((item) => Number(item.value)),
  }
}

export interface VoucherSummaryLine {
  label: string
  value: string
}

const amountOrNone = (value: string, none: string) => (value ? formatPeso(value) : none)
const countOrNone = (value: string, none: string) => (value ? Number(value).toLocaleString() : none)

/** The voucher as it will be saved, one line per setting, for the confirmation step. */
export function summarizeVoucher(values: VoucherFormValues): VoucherSummaryLine[] {
  return [
    { label: 'Code', value: values.code ? values.code.toUpperCase() : 'Generated automatically' },
    { label: 'Name', value: values.name },
    {
      label: 'Discount',
      value: formatDiscount({
        discount_type: values.discount_type,
        discount_value: values.discount_value,
        max_discount_amount: values.discount_type === 'percentage' ? values.max_discount_amount : null,
      }),
    },
    { label: 'Minimum order', value: amountOrNone(values.min_order_amount, 'None') },
    { label: 'Total uses', value: countOrNone(values.total_limit, 'Unlimited') },
    { label: 'Uses per customer', value: countOrNone(values.per_user_limit, 'Unlimited') },
    { label: 'Who can use it', value: values.first_order_only ? 'First order only' : 'Any order' },
    { label: 'With other vouchers', value: values.is_individual_use ? "Can't be combined" : 'Can be combined' },
    { label: 'Starts', value: values.starts_at ? formatDateTime(fromDateTimeInputValue(values.starts_at)) : 'Right away' },
    { label: 'Ends', value: values.expires_at ? formatDateTime(fromDateTimeInputValue(values.expires_at)) : 'No end date' },
    { label: 'Applies to', value: formatScope(values.products, values.categories) },
    { label: 'Status', value: values.is_active ? 'Active' : 'Disabled' },
  ]
}

export interface VoucherChange {
  label: string
  from: string
  to: string
}

/** What saving an edit changes: the summary lines whose value differs from the saved voucher's. */
export function describeVoucherChanges(saved: Voucher, values: VoucherFormValues): VoucherChange[] {
  const before = summarizeVoucher(getVoucherFormDefaults(saved))
  const after = summarizeVoucher(values)
  return after.flatMap((line, index) => {
    const previous = before[index]
    return previous && previous.value !== line.value ? [{ label: line.label, from: previous.value, to: line.value }] : []
  })
}
