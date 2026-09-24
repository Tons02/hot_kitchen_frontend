import { MOBILE_PREFIX, ROLE_LABELS, STAFF_ROLES, STORE_BOUND_ROLES } from './users.constants'
import type { UserFormValues } from './users.schemas'
import type {
  Gender,
  Role,
  StaffRole,
  User,
  UserFilterValues,
  UserListView,
  UserPayload,
  UsersQueryArgs,
  UserStatus,
  VehicleType,
} from './users.types'

export function getRoleLabel(role: Role): string {
  // Falls back to the raw value if the API introduces a role this build doesn't know yet.
  return ROLE_LABELS[role] ?? role
}

export function getFullName(user: Pick<User, 'first_name' | 'last_name' | 'suffix'>): string {
  return [user.first_name, user.last_name, user.suffix].filter(Boolean).join(' ')
}

export function getInitials(user: Pick<User, 'first_name' | 'last_name'>): string {
  return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
}

export function isStaffRole(role: string): role is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(role)
}

/** Store managers, cashiers, kitchen staff and riders belong to one store; admins don't. */
export function isStoreBoundRole(role: string): boolean {
  return (STORE_BOUND_ROLES as readonly string[]).includes(role)
}

export function getUserStatus(user: Pick<User, 'is_deactivated'>, view: UserListView): UserStatus {
  if (view === 'archived') return 'archived'
  return user.is_deactivated ? 'deactivated' : 'active'
}

/** How many of the popover's filters are set, for the badge on the Filters button. */
export function countActiveFilters(filters: UserFilterValues, view: UserListView): number {
  const statusApplies = view === 'current' && filters.status !== 'all'
  return [filters.role !== 'all', filters.storeId !== 'all', statusApplies].filter(Boolean).length
}

/**
 * Query params for `GET /users`. Filters map to UserFilter::$allowedFilters, `search` to its
 * $columnSearch. `pagination` is left out, which makes the API return a paginator with totals.
 */
export function toUsersParams({ view, search, role, storeId, status, page, perPage }: UsersQueryArgs) {
  const params: Record<string, string | number> = { page, per_page: perPage }
  const term = search.trim()

  if (term) params.search = term
  if (role !== 'all') params.role = role
  if (storeId !== 'all') params.store_id = storeId
  if (view === 'archived') params.status = 'inactive'
  // Everyone in the archived view is archived, so the status filter only applies to current users.
  else if (status !== 'all') params.is_deactivated = status === 'deactivated' ? 1 : 0

  return params
}

function stripMobilePrefix(mobileNumber: string): string {
  return mobileNumber.startsWith(MOBILE_PREFIX)
    ? mobileNumber.slice(MOBILE_PREFIX.length)
    : mobileNumber.replace(/\D/g, '').slice(-10)
}

export function getUserFormDefaults(user?: User): UserFormValues {
  const rider = user?.rider_profile

  return {
    profile_picture: null,
    first_name: user?.first_name ?? '',
    middle_name: user?.middle_name ?? '',
    last_name: user?.last_name ?? '',
    suffix: user?.suffix ?? '',
    gender: user?.gender ?? '',
    date_of_birth: user?.date_of_birth.slice(0, 10) ?? '',
    mobile_number: user ? stripMobilePrefix(user.mobile_number) : '',
    username: user?.username ?? '',
    email: user?.email ?? '',
    role: user && isStaffRole(user.role) ? user.role : '',
    store_id: user?.store_id ? String(user.store_id) : '',
    vehicle_type: rider?.vehicle_type ?? '',
    vehicle_brand: rider?.vehicle_brand ?? '',
    plate_number: rider?.plate_number ?? '',
    license_number: rider?.license_number ?? '',
    proof_of_license: null,
  }
}

/** Converts validated form values into the API payload. Only call with values that passed `userSchema`. */
export function toUserPayload(values: UserFormValues): UserPayload {
  const role = values.role as StaffRole

  return {
    first_name: values.first_name,
    middle_name: values.middle_name || undefined,
    last_name: values.last_name,
    suffix: values.suffix || undefined,
    gender: values.gender as Gender,
    date_of_birth: values.date_of_birth,
    mobile_number: `${MOBILE_PREFIX}${values.mobile_number}`,
    username: values.username,
    email: values.email,
    role,
    store_id: isStoreBoundRole(role) ? Number(values.store_id) : undefined,
    profile_picture: values.profile_picture ?? undefined,
    rider:
      role === 'delivery_rider'
        ? {
            vehicle_type: values.vehicle_type as VehicleType,
            vehicle_brand: values.vehicle_brand,
            plate_number: values.plate_number || undefined,
            license_number: values.license_number,
            proof_of_license: values.proof_of_license ?? undefined,
          }
        : undefined,
  }
}

/**
 * Builds the multipart body for create and update.
 * PHP only parses multipart bodies on POST, so updates are sent as POST with `_method=PATCH`.
 */
export function toUserFormData(payload: UserPayload, options: { method?: 'PATCH' } = {}): FormData {
  const body = new FormData()
  const append = (key: string, value: string | number | File | undefined) => {
    if (value === undefined) return
    body.append(key, value instanceof File ? value : String(value))
  }

  append('first_name', payload.first_name)
  append('middle_name', payload.middle_name)
  append('last_name', payload.last_name)
  append('suffix', payload.suffix)
  append('gender', payload.gender)
  append('date_of_birth', payload.date_of_birth)
  append('mobile_number', payload.mobile_number)
  append('username', payload.username)
  append('email', payload.email)
  append('role', payload.role)
  append('store_id', payload.store_id)
  append('profile_picture', payload.profile_picture)

  if (payload.rider) {
    append('vehicle_type', payload.rider.vehicle_type)
    append('vehicle_brand', payload.rider.vehicle_brand)
    append('plate_number', payload.rider.plate_number)
    append('license_number', payload.rider.license_number)
    append('proof_of_license', payload.rider.proof_of_license)
  }

  append('_method', options.method)
  return body
}
