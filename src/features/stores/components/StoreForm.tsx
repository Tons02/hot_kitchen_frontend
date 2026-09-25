import { yupResolver } from '@hookform/resolvers/yup'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { FormErrorAlert } from '@/components/common/FormErrorAlert'
import { FormField } from '@/components/common/FormField'
import { FormSection } from '@/components/common/FormSection'
import { LayeredImagesInput } from '@/components/common/LayeredImagesInput'
import { LoadingButton } from '@/components/common/LoadingButton'
import { ModalBody, ModalFooter } from '@/components/common/Modal'
import { Button } from '@/components/ui/button'
import { DialogClose } from '@/components/ui/dialog'
import { FieldSeparator } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Textarea } from '@/components/ui/textarea'
import { useSingleFlight } from '@/hooks/use-single-flight'
import { applyServerErrors } from '@/lib/form'
import type { ImageSaveProgress, ImageSaveStatus } from '@/lib/layered-images'
import { MOBILE_PREFIX, STORE_IMAGE_TYPES } from '../stores.constants'
import { storeSchema, type StoreFormValues } from '../stores.schemas'
import type {
  Store,
  StoreBackgroundImage,
  StoreImageChanges,
  StorePayload,
} from '../stores.types'
import {
  getStoreFormDefaults,
  getStoreInitials,
  summarizeStoreImageChanges,
  toStoreImageChanges,
  toStorePayload,
} from '../stores.utils'
import { StoreLogoInput } from './StoreLogoInput'
import { StoreSaveConfirmDialog } from './StoreSaveConfirmDialog'

const NO_IMAGES: StoreBackgroundImage[] = []

interface StoreFormProps {
  /** The store being edited. Omit to create a new one. */
  store?: Store
  submitLabel: string
  /**
   * Saves the store, then its images, reporting each image's status through `onImageProgress`.
   * Reject (e.g. with RTK Query's `.unwrap()`) when the store itself fails to save, so the form
   * can show the API's errors.
   */
  onSubmit: (
    payload: StorePayload,
    images: StoreImageChanges,
    onImageProgress: (key: string, status: ImageSaveStatus) => void,
  ) => Promise<unknown>
  /** True while a save is running, so the dialog can refuse to close. */
  onSavingChange: (isSaving: boolean) => void
}

/**
 * Save first validates, then asks for confirmation with a list of the changes, then saves the
 * store and its images one request at a time. Nothing can be edited or cancelled until it's done.
 */
export function StoreForm({ store, submitLabel, onSubmit, onSavingChange }: StoreFormProps) {
  const form = useForm<StoreFormValues>({
    resolver: yupResolver(storeSchema),
    defaultValues: getStoreFormDefaults(store),
  })
  const { control } = form
  const { errors } = form.formState
  const name = useWatch({ control, name: 'name' })

  const [pendingValues, setPendingValues] = useState<StoreFormValues | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [progress, setProgress] = useState<ImageSaveProgress>({})

  const savedImages = store?.background_images ?? NO_IMAGES
  const summary = pendingValues ? summarizeStoreImageChanges(savedImages, toStoreImageChanges(pendingValues)) : null

  // Closing or reloading the tab mid-save would leave the images half updated.
  useEffect(() => {
    if (!isSaving) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [isSaving])

  // Ignores a second click that lands before the button has re-rendered as disabled.
  const save = useSingleFlight(async (values: StoreFormValues) => {
    setIsSaving(true)
    onSavingChange(true)
    setProgress({})
    try {
      await onSubmit(toStorePayload(values), toStoreImageChanges(values), (key, status) =>
        setProgress((current) => ({ ...current, [key]: status })),
      )
    } catch (error) {
      applyServerErrors(error, form.setError)
    } finally {
      setIsSaving(false)
      onSavingChange(false)
    }
  })

  const imageStatuses = Object.values(progress)
  const savingLabel =
    imageStatuses.length === 0
      ? 'Saving store details…'
      : `Saving images: ${imageStatuses.filter((status) => status === 'done').length} of ${imageStatuses.length} done`

  return (
    // Fills the dialog: the fields scroll, the footer stays put.
    <form
      onSubmit={form.handleSubmit((values) => {
        setPendingValues(values)
        setIsConfirmOpen(true)
      })}
      noValidate
      className="flex min-h-0 flex-1 flex-col"
    >
      {/* Disables every field at once while saving. */}
      <fieldset disabled={isSaving} className="contents">
        <ModalBody className="flex flex-col gap-6">
          <FormErrorAlert title="Couldn't save this store" message={errors.root?.server?.message} />

          <FormSection title="Store details">
            <FormField
              control={control}
              name="logo"
              label="Logo"
              optional
              description="PNG, JPG or WebP, up to 10 MB."
              render={(field) => (
                <StoreLogoInput
                  {...field}
                  currentUrl={store?.logo_url}
                  initials={getStoreInitials(name)}
                  status={progress.logo}
                />
              )}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={control}
                name="name"
                label="Store name"
                render={(field) => <Input {...field} placeholder="Hot Kitchen Manila" />}
              />
              <FormField
                control={control}
                name="code"
                label="Store code"
                description="A short unique code, e.g. MNL-01."
                render={(field) => <Input {...field} autoCapitalize="characters" spellCheck={false} />}
              />
            </div>
          </FormSection>

          <FieldSeparator />

          <FormSection title="Storefront banner" description="Shown to customers at the top of the store's page.">
            <FormField
              control={control}
              name="title_banner"
              label="Banner title"
              render={(field) => <Input {...field} placeholder="Welcome to Hot Kitchen" />}
            />
            <FormField
              control={control}
              name="description_banner"
              label="Banner description"
              render={(field) => <Textarea {...field} rows={3} />}
            />
            <FormField
              control={control}
              name="background_images"
              label="Background images"
              optional
              description="PNG, JPG or WebP, up to 10 MB each. Shown in this order; use the arrows to reorder. Changes are saved when you save the store."
              render={(field) => (
                <LayeredImagesInput
                  {...field}
                  accept={STORE_IMAGE_TYPES.join(',')}
                  itemLabel="background image"
                  progress={progress}
                />
              )}
            />
          </FormSection>

          <FieldSeparator />

          <FormSection title="Contact">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={control}
                name="mobile_number"
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
                      placeholder="9171234567"
                      maxLength={10}
                      onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 10))}
                    />
                  </InputGroup>
                )}
              />
              <FormField
                control={control}
                name="email"
                label="Email"
                render={(field) => <Input {...field} type="email" autoComplete="email" />}
              />
            </div>
          </FormSection>

          <FieldSeparator />

          <FormSection title="Address">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={control}
                name="street_name"
                label="Street"
                render={(field) => <Input {...field} autoComplete="address-line1" />}
              />
              <FormField
                control={control}
                name="barangay"
                label="Barangay"
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
                name="region"
                label="Region"
                render={(field) => <Input {...field} placeholder="Region III" />}
              />
              <FormField
                control={control}
                name="postal_code"
                label="Postal code"
                render={(field) => <Input {...field} inputMode="numeric" autoComplete="postal-code" />}
              />
            </div>
          </FormSection>

          <FieldSeparator />

          <FormSection
            title="Map location"
            description="Used for delivery distance. In Google Maps, right-click the store and click the coordinates to copy them."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={control}
                name="latitude"
                label="Latitude"
                render={(field) => <Input {...field} inputMode="decimal" placeholder="14.5211990" />}
              />
              <FormField
                control={control}
                name="longitude"
                label="Longitude"
                render={(field) => <Input {...field} inputMode="decimal" placeholder="121.0650720" />}
              />
            </div>
          </FormSection>
        </ModalBody>
      </fieldset>

      <ModalFooter className="items-center">
        {isSaving && (
          <p role="status" className="mr-auto text-sm text-muted-foreground sm:self-center">
            {savingLabel}
          </p>
        )}
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={isSaving}>
            Cancel
          </Button>
        </DialogClose>
        <LoadingButton type="submit" isLoading={isSaving} className="ml-2">
          {submitLabel}
        </LoadingButton>
      </ModalFooter>

      <StoreSaveConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        isEditing={store !== undefined}
        storeName={pendingValues?.name ?? name}
        summary={summary}
        onConfirm={() => {
          setIsConfirmOpen(false)
          if (pendingValues) void save(pendingValues)
        }}
      />
    </form>
  )
}
