/** Lifecycle status, decided by the API in this order: archived, disabled, scheduled, expired, used_up, active. */
export type VoucherStatus = 'active' | 'scheduled' | 'expired' | 'used_up' | 'disabled' | 'archived'

export type DiscountType = 'percentage' | 'fixed_amount' | 'free_delivery'

export interface VoucherProductRef {
  id: number
  name: string
  sku: string | null
}

export interface VoucherCategoryRef {
  id: number
  name: string
}

/** Mirrors the API's VoucherResource. Money arrives as decimal strings ("100.00"). */
export interface Voucher {
  id: number
  store_id: number
  /** Uppercase; locked once the voucher has been used. */
  code: string
  name: string
  description: string | null
  status: VoucherStatus
  discount_type: DiscountType
  /** Percent for percentage vouchers, pesos for fixed amounts, 0 for free delivery. */
  discount_value: string
  min_order_amount: string | null
  /** Caps a percentage discount. Always null for other types. */
  max_discount_amount: string | null
  /** Null = unlimited. */
  total_limit: number | null
  per_user_limit: number | null
  used_count: number
  remaining_uses: number | null
  first_order_only: boolean
  /** True = can't be combined with other vouchers. */
  is_individual_use: boolean
  is_active: boolean
  starts_at: string | null
  expires_at: string | null
  /** Empty (or both empty with categories) = the whole store. */
  products?: VoucherProductRef[]
  categories?: VoucherCategoryRef[]
  usages_count?: number
  /** Only on `GET /store-vouchers/{store}/{voucher}`. */
  total_discount_given?: string
  created_by: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/** Mirrors VoucherUsageResource: one redemption. */
export interface VoucherUsage {
  id: number
  voucher_id: number
  user_id: number
  user?: { id: number; name: string; username: string }
  order_id: number | null
  discount_amount: string
  used_at: string
}

/** The status tabs. 'all' lists every voucher that isn't archived. */
export type VoucherStatusFilter = 'all' | VoucherStatus

/** Everything that selects which vouchers the table asks the API for (the page aside). */
export interface StoreVouchersQueryArgs {
  storeId: number
  status: VoucherStatusFilter
  /** Matches code, name or description (VoucherFilter::$columnSearch). */
  search: string
  /** 'all' or a DiscountType. */
  discountType: string
  page: number
  perPage: number
}

/** A row action: view and edit open panels, the rest a confirmation. */
export interface VoucherAction {
  type: 'view' | 'edit' | 'toggle' | 'archive' | 'restore'
  voucher: Voucher
}

/** Everything `POST` / `PATCH /store-vouchers/{store}[/{voucher}]` accept (StoreVoucherRequest). */
export interface VoucherPayload {
  /** Null on create lets the API generate one. */
  code: string | null
  name: string
  description: string | null
  discount_type: DiscountType
  discount_value: number | null
  min_order_amount: number | null
  max_discount_amount: number | null
  total_limit: number | null
  per_user_limit: number | null
  first_order_only: boolean
  is_individual_use: boolean
  /** Always sent: the API resets it to true when it's left out, which would re-enable a disabled voucher. */
  is_active: boolean
  /** ISO timestamps (UTC). */
  starts_at: string | null
  expires_at: string | null
  /** Empty lists = no restriction. Always sent, so removing every item clears the restriction. */
  product_ids: number[]
  category_ids: number[]
}
