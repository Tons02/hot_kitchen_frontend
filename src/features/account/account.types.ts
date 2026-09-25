export type AddressLabel = 'home' | 'office' | 'work' | 'other'

/** Mirrors the API's UserAddressResource: a saved delivery address. */
export interface UserAddress {
  id: number
  label: AddressLabel
  recipient_name: string
  /** +63 followed by 10 digits. */
  recipient_phone: string
  address_line: string
  barangay: string | null
  city: string
  province: string
  postal_code: string | null
  /** Where the rider goes. Decimal strings, e.g. "14.5211990". */
  latitude: string
  longitude: string
  delivery_notes: string | null
  /** Exactly one address is the default while any exist (the API keeps it that way). */
  is_default: boolean
  created_at: string
  updated_at: string
}

/** `PATCH /me` (UpdateProfileRequest). Send only what changes. */
export interface UpdateProfileRequest {
  first_name?: string
  middle_name?: string | null
  last_name?: string
  suffix?: string | null
  /** +63 followed by 10 digits. */
  mobile_number?: string
}

/** `PATCH /me/password` (ChangePasswordRequest). Other devices are signed out; this one stays. */
export interface ChangePasswordRequest {
  current_password: string
  password: string
  password_confirmation: string
}

/** `POST /me/addresses` and `PATCH /me/addresses/{id}` (UserAddressRequest). */
export interface AddressPayload {
  label: AddressLabel
  recipient_name: string
  recipient_phone: string
  address_line: string
  barangay: string | null
  city: string
  province: string
  postal_code: string | null
  latitude: number
  longitude: number
  delivery_notes: string | null
  is_default: boolean
}

/** A row action on a saved address: edit opens the form, the rest a confirmation. */
export interface AddressAction {
  type: 'edit' | 'default' | 'delete'
  address: UserAddress
}
