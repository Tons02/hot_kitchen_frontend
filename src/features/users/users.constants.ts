import type { Gender, Role, StaffRole, UserFilterValues, VehicleType } from './users.types'

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrator',
  store_manager: 'Store Manager',
  cashier: 'Cashier',
  kitchen_staff: 'Kitchen Staff',
  delivery_rider: 'Delivery Rider',
  customer: 'Customer',
  finance: 'Finance',
}

/** Roles that can be assigned from User Management, in the order they're offered. */
export const STAFF_ROLES: readonly StaffRole[] = [
  'admin',
  'store_manager',
  'cashier',
  'kitchen_staff',
  'delivery_rider',
]

/** Roles tied to a single store. Admins work across all stores. Mirrors the API's UserRequest. */
export const STORE_BOUND_ROLES: readonly StaffRole[] = [
  'store_manager',
  'cashier',
  'kitchen_staff',
  'delivery_rider',
]

export const GENDER_LABELS: Record<Gender, string> = {
  male: 'Male',
  female: 'Female',
  rather_not_say: 'Rather not say',
}

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  motorcycle: 'Motorcycle',
  bicycle: 'Bicycle',
  car: 'Car',
}

/** Upload limits enforced by the API. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
export const PROFILE_PICTURE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const
export const PROOF_OF_LICENSE_TYPES = [...PROFILE_PICTURE_TYPES, 'application/pdf'] as const

/** Philippine mobile numbers: the API expects +63 followed by 10 digits. */
export const MOBILE_PREFIX = '+63'

export const DEFAULT_USER_FILTERS: UserFilterValues = {
  search: '',
  role: 'all',
  storeId: 'all',
  status: 'all',
}
