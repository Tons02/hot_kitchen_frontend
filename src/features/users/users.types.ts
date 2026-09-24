/** Every role the API can return. Only `StaffRole`s can be assigned from User Management. */
export type Role =
  | 'admin'
  | 'store_manager'
  | 'cashier'
  | 'kitchen_staff'
  | 'delivery_rider'
  | 'customer'
  | 'finance'

export type StaffRole = Extract<Role, 'admin' | 'store_manager' | 'cashier' | 'kitchen_staff' | 'delivery_rider'>

export type Gender = 'male' | 'female' | 'rather_not_say'

export type VehicleType = 'motorcycle' | 'bicycle' | 'car'

export interface RiderProfile {
  id: number
  vehicle_type: VehicleType
  vehicle_brand: string
  plate_number: string | null
  license_number: string
  /** Short-lived signed URL (expires after a few minutes). */
  proof_of_license_url?: string
}

/** The store a staff member is tagged to, as embedded in UserResource. */
export interface UserStore {
  id: number
  code: string
  name: string
}

/** Mirrors the API's UserResource. */
export interface User {
  id: number
  /** Short-lived signed URL (expires after a few minutes). */
  profile_picture_url?: string
  first_name: string
  middle_name: string | null
  last_name: string
  suffix: string | null
  gender: Gender
  mobile_number: string
  date_of_birth: string
  username: string
  email: string
  role: Role
  store_id: number | null
  /** Present when the API loads the relation; null for users without a store (admins). */
  store?: UserStore | null
  rider_profile?: RiderProfile | null
  is_deactivated: boolean
  deactivated_date: string | null
  created_at: string
  updated_at: string
}

/** Which list to load: current staff, or soft-deleted (archived) users. */
export type UserListView = 'current' | 'archived'

export type UserStatus = 'active' | 'deactivated' | 'archived'

/** A row action: edit opens the form dialog, the rest a confirmation. */
export interface UserAction {
  type: 'edit' | 'deactivate' | 'activate' | 'archive'
  user: User
}

/** The filter popover's fields. 'all' means "no filter". */
export interface UserFilterValues {
  role: string
  storeId: string
  status: string
}

/** Everything that selects which users the list asks the API for (the page aside). */
export interface UsersQueryFilters extends UserFilterValues {
  view: UserListView
  /** Sent as `search`; the API matches it against the columns in UserFilter::$columnSearch. */
  search: string
}

export interface UsersQueryArgs extends UsersQueryFilters {
  page: number
  perPage: number
}

/** Everything `POST /users` and `PATCH /users/{id}` accept. Sent as multipart form data. */
export interface UserPayload {
  first_name: string
  middle_name?: string
  last_name: string
  suffix?: string
  gender: Gender
  date_of_birth: string
  /** Full international format, e.g. +639171234567. */
  mobile_number: string
  username: string
  email: string
  role: StaffRole
  /** Required for every role except admin. */
  store_id?: number
  /** Only sent when a new picture was chosen. */
  profile_picture?: File
  /** Only for delivery riders. */
  rider?: {
    vehicle_type: VehicleType
    vehicle_brand: string
    plate_number?: string
    license_number: string
    /** Required when creating a rider; optional when updating one. */
    proof_of_license?: File
  }
}

export interface DeactivateUserRequest {
  id: number
  deactivate_reason: string
}
