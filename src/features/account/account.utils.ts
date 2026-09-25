import { MOBILE_PREFIX } from '@/features/users/users.constants'
import type { User } from '@/features/users/users.types'
import { getFullName } from '@/features/users/users.utils'
import { ADDRESS_LABELS } from './account.constants'
import type { AddressFormValues, ProfileFormValues } from './account.schemas'
import type { AddressLabel, AddressPayload, UpdateProfileRequest, UserAddress } from './account.types'

/** "+639171234567" → "9171234567", the part after the fixed +63 prefix the inputs show. */
export function stripMobilePrefix(mobile: string): string {
  return mobile.startsWith(MOBILE_PREFIX) ? mobile.slice(MOBILE_PREFIX.length) : mobile.replace(/\D/g, '').slice(-10)
}

export interface FieldChange {
  label: string
  from: string
  to: string
}

const PROFILE_FIELDS: { key: keyof ProfileFormValues; label: string }[] = [
  { key: 'first_name', label: 'First name' },
  { key: 'middle_name', label: 'Middle name' },
  { key: 'last_name', label: 'Last name' },
  { key: 'suffix', label: 'Suffix' },
  { key: 'mobile_number', label: 'Mobile number' },
]

export function getProfileDefaults(user: User): ProfileFormValues {
  return {
    first_name: user.first_name,
    middle_name: user.middle_name ?? '',
    last_name: user.last_name,
    suffix: user.suffix ?? '',
    mobile_number: stripMobilePrefix(user.mobile_number),
  }
}

const shown = (key: keyof ProfileFormValues, value: string) =>
  !value ? 'None' : key === 'mobile_number' ? `${MOBILE_PREFIX}${value}` : value

/** What saving the profile changes, old → new, for the confirmation step. */
export function describeProfileChanges(user: User, values: ProfileFormValues): FieldChange[] {
  const before = getProfileDefaults(user)
  return PROFILE_FIELDS.flatMap(({ key, label }) =>
    before[key] === values[key] ? [] : [{ label, from: shown(key, before[key]), to: shown(key, values[key]) }],
  )
}

/** Only the fields that changed, as `PATCH /me` expects. */
export function toProfilePayload(user: User, values: ProfileFormValues): UpdateProfileRequest {
  const before = getProfileDefaults(user)
  const payload: UpdateProfileRequest = {}
  if (values.first_name !== before.first_name) payload.first_name = values.first_name
  if (values.middle_name !== before.middle_name) payload.middle_name = values.middle_name || null
  if (values.last_name !== before.last_name) payload.last_name = values.last_name
  if (values.suffix !== before.suffix) payload.suffix = values.suffix || null
  if (values.mobile_number !== before.mobile_number) payload.mobile_number = `${MOBILE_PREFIX}${values.mobile_number}`
  return payload
}

/** A new address starts addressed to the customer; the first one is always the default (the API's rule). */
export function getAddressDefaults(user: User | null, address?: UserAddress, isFirst = false): AddressFormValues {
  return {
    label: address?.label ?? 'home',
    recipient_name: address?.recipient_name ?? (user ? getFullName(user) : ''),
    recipient_phone: stripMobilePrefix(address?.recipient_phone ?? user?.mobile_number ?? ''),
    address_line: address?.address_line ?? '',
    barangay: address?.barangay ?? '',
    city: address?.city ?? '',
    province: address?.province ?? '',
    postal_code: address?.postal_code ?? '',
    latitude: address ? String(Number(address.latitude)) : '',
    longitude: address ? String(Number(address.longitude)) : '',
    delivery_notes: address?.delivery_notes ?? '',
    is_default: address?.is_default ?? isFirst,
  }
}

export function toAddressPayload(values: AddressFormValues): AddressPayload {
  return {
    label: values.label as AddressLabel,
    recipient_name: values.recipient_name,
    recipient_phone: `${MOBILE_PREFIX}${values.recipient_phone}`,
    address_line: values.address_line,
    barangay: values.barangay || null,
    city: values.city,
    province: values.province,
    postal_code: values.postal_code || null,
    latitude: Number(values.latitude),
    longitude: Number(values.longitude),
    delivery_notes: values.delivery_notes || null,
    is_default: values.is_default,
  }
}

/** "12 Rizal St, Baliti, Angeles, Pampanga 2009". */
export function formatAddress(address: {
  address_line: string
  barangay: string | null
  city: string
  province: string
  postal_code: string | null
}): string {
  const place = [address.address_line, address.barangay, address.city, address.province].filter(Boolean).join(', ')
  return address.postal_code ? `${place} ${address.postal_code}` : place
}

/** A Google Maps link to the pin, so the customer can check the rider will find the right spot. */
export function getMapUrl(latitude: string | number, longitude: string | number): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(`${latitude},${longitude}`)}`
}

export interface SummaryLine {
  label: string
  value: string
}

/** The address as it will be saved, one line per part, for the confirmation step. */
export function summarizeAddress(values: AddressFormValues): SummaryLine[] {
  return [
    { label: 'Label', value: ADDRESS_LABELS[values.label as AddressLabel] ?? values.label },
    { label: 'Recipient', value: `${values.recipient_name} · ${MOBILE_PREFIX}${values.recipient_phone}` },
    { label: 'Address', value: formatAddress(values) },
    { label: 'Map pin', value: `${values.latitude}, ${values.longitude}` },
    { label: 'Rider notes', value: values.delivery_notes || 'None' },
    { label: 'Default', value: values.is_default ? 'Yes' : 'No' },
  ]
}

/** What saving an address edit changes: the summary lines that differ from the saved address. */
export function describeAddressChanges(user: User | null, saved: UserAddress, values: AddressFormValues): FieldChange[] {
  const before = summarizeAddress(getAddressDefaults(user, saved))
  return summarizeAddress(values).flatMap((line, index) => {
    const previous = before[index]
    return previous && previous.value !== line.value ? [{ label: line.label, from: previous.value, to: line.value }] : []
  })
}
