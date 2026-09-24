import { yupResolver } from '@hookform/resolvers/yup'
import { ExternalLinkIcon } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router'
import { FileInput } from '@/components/common/FileInput'
import { FormErrorAlert } from '@/components/common/FormErrorAlert'
import { FormField } from '@/components/common/FormField'
import { FormSection } from '@/components/common/FormSection'
import { LoadingButton } from '@/components/common/LoadingButton'
import { SelectInput, type SelectOption } from '@/components/common/SelectInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { useStoreOptions } from '@/features/stores/hooks/useStoreOptions'
import { todayIsoDate } from '@/lib/date'
import { applyServerErrors } from '@/lib/form'
import { ROUTES } from '@/routes/paths'
import {
  GENDER_LABELS,
  MOBILE_PREFIX,
  PROOF_OF_LICENSE_TYPES,
  ROLE_LABELS,
  STAFF_ROLES,
  VEHICLE_TYPE_LABELS,
} from '../users.constants'
import { userSchema, type UserFormValues } from '../users.schemas'
import type { User, UserPayload } from '../users.types'
import { getUserFormDefaults, isStoreBoundRole, toUserPayload } from '../users.utils'
import { ProfilePictureInput } from './ProfilePictureInput'

const toOptions = (labels: Record<string, string>): SelectOption[] =>
  Object.entries(labels).map(([value, label]) => ({ value, label }))

const GENDER_OPTIONS = toOptions(GENDER_LABELS)
const VEHICLE_TYPE_OPTIONS = toOptions(VEHICLE_TYPE_LABELS)
const ROLE_OPTIONS: SelectOption[] = STAFF_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }))

interface UserFormProps {
  /** The user being edited. Omit to create a new one. */
  user?: User
  submitLabel: string
  /** Saves the user. Reject (e.g. with RTK Query's `.unwrap()`) so the form can show the API's errors. */
  onSubmit: (payload: UserPayload) => Promise<unknown>
}

export function UserForm({ user, submitLabel, onSubmit }: UserFormProps) {
  const isEditing = user !== undefined
  const currentLicenseUrl = user?.rider_profile?.proof_of_license_url

  const form = useForm<UserFormValues>({
    resolver: yupResolver(userSchema),
    defaultValues: getUserFormDefaults(user),
    context: { hasProofOfLicense: Boolean(currentLicenseUrl) },
  })
  const { control } = form
  const { isSubmitting, errors } = form.formState

  const [role, firstName, lastName] = useWatch({ control, name: ['role', 'first_name', 'last_name'] })
  const isStoreBound = isStoreBoundRole(role)
  const isRider = role === 'delivery_rider'
  const initials = `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase()

  const stores = useStoreOptions()

  const submit = async (values: UserFormValues) => {
    try {
      await onSubmit(toUserPayload(values))
    } catch (error) {
      applyServerErrors(error, form.setError)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate className="flex max-w-4xl flex-col gap-6">
      <FormErrorAlert title="Couldn't save this user" message={errors.root?.server?.message} />

      <FormSection title="Profile">
        <FormField
          control={control}
          name="profile_picture"
          label="Profile picture"
          optional
          description="PNG, JPG or WebP, up to 10 MB."
          render={(field) => (
            <ProfilePictureInput {...field} currentUrl={user?.profile_picture_url} initials={initials} />
          )}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={control}
            name="first_name"
            label="First name"
            render={(field) => <Input {...field} autoComplete="given-name" />}
          />
          <FormField
            control={control}
            name="middle_name"
            label="Middle name"
            optional
            render={(field) => <Input {...field} autoComplete="additional-name" />}
          />
          <FormField
            control={control}
            name="last_name"
            label="Last name"
            render={(field) => <Input {...field} autoComplete="family-name" />}
          />
          <FormField
            control={control}
            name="suffix"
            label="Suffix"
            optional
            render={(field) => <Input {...field} placeholder="Jr., Sr., III" autoComplete="honorific-suffix" />}
          />
          <FormField
            control={control}
            name="gender"
            label="Gender"
            render={(field) => <SelectInput {...field} options={GENDER_OPTIONS} placeholder="Select gender" />}
          />
          <FormField
            control={control}
            name="date_of_birth"
            label="Date of birth"
            render={(field) => <Input {...field} type="date" max={todayIsoDate()} autoComplete="bday" />}
          />
        </div>
      </FormSection>

      <FormSection title="Contact and sign-in">
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
        <FormField
          control={control}
          name="username"
          label="Username"
          description={
            isEditing
              ? 'Used to sign in.'
              : 'Used to sign in. Their first password is the same as the username.'
          }
          render={(field) => <Input {...field} autoComplete="off" autoCapitalize="none" spellCheck={false} />}
        />
      </FormSection>

      <FormSection
        title="Role and store"
        description="Store managers, cashiers, kitchen staff and riders work at one store. Administrators work across all stores."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={control}
            name="role"
            label="Role"
            render={(field) => <SelectInput {...field} options={ROLE_OPTIONS} placeholder="Select role" />}
          />
          {isStoreBound && (
            <FormField
              control={control}
              name="store_id"
              label="Store"
              description={stores.isError ? "Couldn't load stores. Refresh the page to try again." : undefined}
              render={(field) => (
                <SelectInput
                  {...field}
                  options={stores.options}
                  disabled={stores.isLoading || stores.isError}
                  placeholder={stores.isLoading ? 'Loading stores…' : 'Select store'}
                />
              )}
            />
          )}
        </div>
      </FormSection>

      {isRider && (
        <FormSection title="Rider details" description="Vehicle and license details for deliveries.">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={control}
              name="vehicle_type"
              label="Vehicle type"
              render={(field) => (
                <SelectInput {...field} options={VEHICLE_TYPE_OPTIONS} placeholder="Select vehicle type" />
              )}
            />
            <FormField
              control={control}
              name="vehicle_brand"
              label="Vehicle brand"
              render={(field) => <Input {...field} placeholder="Honda" />}
            />
            <FormField
              control={control}
              name="plate_number"
              label="Plate number"
              optional
              render={(field) => <Input {...field} autoCapitalize="characters" />}
            />
            <FormField
              control={control}
              name="license_number"
              label="Driver's license number"
              render={(field) => <Input {...field} autoCapitalize="characters" />}
            />
          </div>
          <FormField
            control={control}
            name="proof_of_license"
            label="Proof of license"
            optional={Boolean(currentLicenseUrl)}
            description={
              <>
                A photo or scan of the license: PNG, JPG, WebP or PDF, up to 10 MB.
                {currentLicenseUrl && (
                  <>
                    {' '}
                    <a
                      href={currentLicenseUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
                    >
                      View current file
                      <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
                    </a>
                  </>
                )}
              </>
            }
            render={(field) => (
              <FileInput
                {...field}
                accept={PROOF_OF_LICENSE_TYPES.join(',')}
                placeholder={currentLicenseUrl ? 'Current file on record' : 'No file chosen'}
              />
            )}
          />
        </FormSection>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" asChild>
          <Link to={ROUTES.users}>Cancel</Link>
        </Button>
        <LoadingButton type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </LoadingButton>
      </div>
    </form>
  )
}
