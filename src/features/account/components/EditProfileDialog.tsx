import { yupResolver } from '@hookform/resolvers/yup'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { ChangeList } from '@/components/common/ChangeList'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { FormErrorAlert } from '@/components/common/FormErrorAlert'
import { FormField } from '@/components/common/FormField'
import { LoadingButton } from '@/components/common/LoadingButton'
import { ModalBody, ModalContent, ModalFooter, ModalHeader } from '@/components/common/Modal'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { MOBILE_PREFIX } from '@/features/users/users.constants'
import type { User } from '@/features/users/users.types'
import { useSingleFlight } from '@/hooks/use-single-flight'
import { applyServerErrors } from '@/lib/form'
import { profileSchema, type ProfileFormValues } from '../account.schemas'
import { describeProfileChanges, getProfileDefaults, toProfilePayload } from '../account.utils'
import { useUpdateProfileMutation } from '../accountApi'

interface EditProfileDialogProps {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Name and mobile number. Email and username are managed separately (UpdateProfileRequest leaves them out). */
export function EditProfileDialog({ user, open, onOpenChange }: EditProfileDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-lg">
        <ModalHeader title="Edit information" description="Your name and the mobile number stores use to reach you." />
        {/* Remounted on every opening, so it starts from what's saved. */}
        {open && <EditProfileForm user={user} onDone={() => onOpenChange(false)} />}
      </ModalContent>
    </Dialog>
  )
}

function EditProfileForm({ user, onDone }: { user: User; onDone: () => void }) {
  const [updateProfile] = useUpdateProfileMutation()
  const form = useForm<ProfileFormValues>({
    resolver: yupResolver(profileSchema),
    defaultValues: getProfileDefaults(user),
    mode: 'onTouched',
  })
  const { control } = form
  const { isDirty, errors } = form.formState

  const [pendingValues, setPendingValues] = useState<ProfileFormValues | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const changes = pendingValues ? describeProfileChanges(user, pendingValues) : []

  // Ignores a second click that lands before the button has re-rendered as disabled.
  const save = useSingleFlight(async (values: ProfileFormValues) => {
    setIsSaving(true)
    try {
      await updateProfile(toProfilePayload(user, values)).unwrap()
      toast.success('Your information was updated.')
      onDone()
    } catch (error) {
      // e.g. "The mobile number has already been taken." lands under that field.
      setIsConfirmOpen(false)
      applyServerErrors(error, form.setError)
    } finally {
      setIsSaving(false)
    }
  })

  return (
    <form
      onSubmit={form.handleSubmit((values) => {
        // Trimming can undo an edit; there's nothing to confirm then.
        if (describeProfileChanges(user, values).length === 0) {
          toast.info('Nothing changed.')
          return
        }
        setPendingValues(values)
        setIsConfirmOpen(true)
      })}
      noValidate
      className="flex min-h-0 flex-1 flex-col"
    >
      <ModalBody className="flex flex-col gap-5">
        <FormErrorAlert title="Couldn't save your information" message={errors.root?.server?.message} />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={control}
            name="first_name"
            label="First name"
            render={(field) => <Input {...field} autoComplete="given-name" />}
          />
          <FormField
            control={control}
            name="last_name"
            label="Last name"
            render={(field) => <Input {...field} autoComplete="family-name" />}
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
            name="suffix"
            label="Suffix"
            optional
            render={(field) => <Input {...field} placeholder="Jr., Sr., III" autoComplete="honorific-suffix" />}
          />
        </div>
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
                maxLength={10}
                onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 10))}
              />
            </InputGroup>
          )}
        />
        <p className="text-sm text-muted-foreground">
          Email and username can't be changed here. Contact support if you need to update them.
        </p>
      </ModalBody>

      <ModalFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={isSaving}>
            Cancel
          </Button>
        </DialogClose>
        <LoadingButton type="submit" isLoading={isSaving} disabled={!isDirty} className="ml-2">
          Save changes
        </LoadingButton>
      </ModalFooter>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Save these changes?"
        description="Check that everything is correct."
        confirmLabel="Yes, save changes"
        isLoading={isSaving}
        onConfirm={() => pendingValues && void save(pendingValues)}
      >
        <ChangeList changes={changes} />
      </ConfirmDialog>
    </form>
  )
}
