/**
 * Mirrors the scalar fields of the API's StoreResource.
 * Nested collections (background images, operating hours, delivery radius) get typed
 * when the Stores feature needs them.
 */
export interface Store {
  id: number
  logo_url?: string
  code: string
  name: string
  title_banner: string
  description_banner: string
  region: string
  province: string
  city: string
  barangay: string
  street_name: string
  postal_code: string
  latitude: string
  longitude: string
  mobile_number: string
  email: string
  is_active: boolean
  created_at: string
  updated_at: string
}
