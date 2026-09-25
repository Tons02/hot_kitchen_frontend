import { yupResolver } from '@hookform/resolvers/yup'
import { ExternalLinkIcon, LocateFixedIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { useAppSelector } from '@/app/hooks'
import { ChangeList } from '@/components/common/ChangeList'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { FormErrorAlert } from '@/components/common/FormErrorAlert'
import { FormField } from '@/components/common/FormField'
import { FormSection } from '@/components/common/FormSection'
import { FormSwitchField } from '@/components/common/FormSwitchField'
import { LoadingButton } from '@/components/common/LoadingButton'
import { ModalBody, ModalContent, ModalFooter, ModalHeader } from '@/components/common/Modal'
import { SelectInput } from '@/components/common/SelectInput'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose } from '@/components/ui/dialog'
import { FieldSeparator } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { selectCurrentUser } from '@/features/auth/authSlice'
import { useCurrentLocation } from '@/features/customer/hooks/useCurrentLocation'
import { MOBILE_PREFIX } from '@/features/users/users.constants'
import { useSingleFlight } from '@/hooks/use-single-flight'
import { applyServerErrors } from '@/lib/form'
import { ADDRESS_LABEL_OPTIONS } from '../account.constants'
import { addressSchema, type AddressFormValues } from '../account.schemas'
import type { UserAddress } from '../account.types'
import { describeAddressChanges, getAddressDefaults, getMapUrl, summarizeAddress, toAddressPayload } from '../account.utils'
import { useCreateAddressMutation, useUpdateAddressMutation } from '../accountApi'

export type AddressFormTarget = { mode: 'create'; isFirst: boolean } | { mode: 'edit'; address: UserAddress }

interface AddressFormDialogProps {
  /** Kept after closing so the content doesn't blank out during the exit animation. */
  target: AddressFormTarget | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddressFormDialog({ target, open, onOpenChange }: AddressFormDialogProps) {
  const isEditing = target?.mode === 'edit'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-2xl">
        <ModalHeader
          title={isEditing ? 'Edit address' : 'Add address'}
          description="Where riders deliver your orders."
        />
        {/* Remounted on every opening, so it starts from what's saved. */}
        {open && target && <AddressForm target={target} onDone={() => onOpenChange(false)} />}
      </ModalContent>
    </Dialog>
  )
}

function AddressForm({ target, onDone }: { target: AddressFormTarget; onDone: () => void }) {
  const user = useAppSelector(selectCurrentUser)
  const saved = target.mode === 'edit' ? target.address : undefined
  const isFirst = target.mode === 'create' && target.isFirst
  const [createAddress] = useCreateAddressMutation()
  const [updateAddress] = useUpdateAddressMutation()

  const form = useForm<AddressFormValues>({
    resolver: yupResolver(addressSchema),
    defaultValues: getAddressDefaults(user, saved, isFirst),
    mode: 'onTouched',
  })
  const { control } = form
  const { errors } = form.formState
  const [latitude, longitude] = useWatch({ control, name: ['latitude', 'longitude'] })
  const hasPin = latitude !== '' && longitude !== '' && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))

  // Fills the map pin from the device's location, only when the customer asks.
  const location = useCurrentLocation()
  useEffect(() => {
    if (!location.coords) return
    form.setValue('latitude', location.coords.latitude.toFixed(7), { shouldValidate: true, shouldDirty: true })
    form.setValue('longitude', location.coords.longitude.toFixed(7), { shouldValidate: true, shouldDirty: true })
  }, [location.coords, form])

  const [pendingValues, setPendingValues] = useState<AddressFormValues | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const changes = pendingValues && saved ? describeAddressChanges(user, saved, pendingValues) : []

  // Ignores a second click that lands before the button has re-rendered as disabled.
  const save = useSingleFlight(async (values: AddressFormValues) => {
    setIsSaving(true)
    try {
      const payload = toAddressPayload(values)
      if (saved) await updateAddress({ id: saved.id, payload }).unwrap()
      else await createAddress(payload).unwrap()
      toast.success(saved ? 'Your address was updated.' : 'Your address was added.')
      onDone()
    } catch (error) {
      // e.g. "You can save up to 10 addresses." or a field error, shown in the form.
      setIsConfirmOpen(false)
      applyServerErrors(error, form.setError)
    } finally {
      setIsSaving(false)
    }
  })

  return (
    <form
      onSubmit={form.handleSubmit((values) => {
        if (saved && describeAddressChanges(user, saved, values).length === 0) {
          toast.info('Nothing changed.')
          return
        }
        setPendingValues(values)
        setIsConfirmOpen(true)
      })}
      noValidate
      className="flex min-h-0 flex-1 flex-col"
    >
      <fieldset disabled={isSaving} className="contents">
        <ModalBody className="flex flex-col gap-6">
          <FormErrorAlert title="Couldn't save this address" message={errors.root?.server?.message} />

          <FormSection title="Recipient">
            <div className="grid gap-5 sm:grid-cols-3">
              <FormField
                control={control}
                name="label"
                label="Label"
                render={(field) => <SelectInput {...field} options={ADDRESS_LABEL_OPTIONS} />}
              />
              <FormField
                control={control}
                name="recipient_name"
                label="Name"
                render={(field) => <Input {...field} autoComplete="name" />}
              />
              <FormField
                control={control}
                name="recipient_phone"
                label="Mobile number"
                render={({ onChange, ...field }) => (
                  <InputGroup>
                    <InputGroupAddon>
                      <InputGroupText>{MOBILE_PREFIX}</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      {...field}
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      maxLength={10}
                      onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 10))}
                    />
                  </InputGroup>
                )}
              />
            </div>
          </FormSection>

          <FieldSeparator />

          <FormSection title="Address">
            <FormField
              control={control}
              name="address_line"
              label="House no., street, building"
              render={(field) => <Input {...field} autoComplete="address-line1" placeholder="12 Rizal St, Unit 3B" />}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={control}
                name="barangay"
                label="Barangay"
                optional
                render={(field) => <Input {...field} />}
              />
              <FormField
                control={control}
                name="city"
                label="City / municipality"
                render={(field) => <Input {...field} autoComplete="address-level2" />}
              />
              <FormField
                control={control}
                name="province"
                label="Province"
                render={(field) => <Input {...field} autoComplete="address-level1" />}
              />
              <FormField
                control={control}
                name="postal_code"
                label="Postal code"
                optional
                render={(field) => <Input {...field} inputMode="numeric" autoComplete="postal-code" />}
              />
            </div>
          </FormSection>

          <FieldSeparator />

          <FormSection
            title="Map pin"
            description="Where the rider goes. Use your location if you're there now, or copy the coordinates from Google Maps (right-click the spot)."
          >
            <div className="flex flex-wrap items-center gap-3">
              {location.status !== 'unavailable' && (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={location.request}
                  disabled={location.status === 'locating'}
                >
                  {location.status === 'locating' ? <Spinner /> : <LocateFixedIcon />}
                  Use my current location
                </Button>
              )}
              {hasPin && (
                <a
                  href={getMapUrl(latitude, longitude)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  Check the pin on Google Maps
                  <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
            {location.status === 'denied' && (
              <p role="status" className="text-sm text-muted-foreground">
                Location is turned off for this site. Type the coordinates instead.
              </p>
            )}
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={control}
                name="latitude"
                label="Latitude"
                render={(field) => <Input {...field} inputMode="decimal" placeholder="14.5995124" />}
              />
              <FormField
                control={control}
                name="longitude"
                label="Longitude"
                render={(field) => <Input {...field} inputMode="decimal" placeholder="120.9842195" />}
              />
            </div>
          </FormSection>

          <FieldSeparator />

          <FormField
            control={control}
            name="delivery_notes"
            label="Notes for the rider"
            optional
            render={(field) => (
              <Textarea {...field} rows={2} maxLength={500} placeholder="e.g. Green gate beside the sari-sari store." />
            )}
          />

          <FormSwitchField
            control={control}
            name="is_default"
            label="Default address"
            description={
              isFirst
                ? 'Your first address is always your default.'
                : saved?.is_default
                  ? 'To change your default, make another address the default.'
                  : 'Used first when you check out.'
            }
            disabled={isFirst || Boolean(saved?.is_default)}
          />
        </ModalBody>
      </fieldset>

      <ModalFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={isSaving}>
            Cancel
          </Button>
        </DialogClose>
        <LoadingButton type="submit" isLoading={isSaving} className="ml-2">
          {saved ? 'Save changes' : 'Add address'}
        </LoadingButton>
      </ModalFooter>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={saved ? 'Save changes to this address?' : 'Add this address?'}
        description="Check that the rider will find you."
        confirmLabel={saved ? 'Yes, save changes' : 'Yes, add address'}
        isLoading={isSaving}
        onConfirm={() => pendingValues && void save(pendingValues)}
      >
        {saved ? (
          <ChangeList changes={changes} />
        ) : (
          pendingValues && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              {summarizeAddress(pendingValues).map((line) => (
                <div key={line.label} className="contents">
                  <dt className="text-muted-foreground">{line.label}</dt>
                  <dd className="font-medium break-words">{line.value}</dd>
                </div>
              ))}
            </dl>
          )
        )}
      </ConfirmDialog>
    </form>
  )
}
