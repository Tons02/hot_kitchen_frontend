import { yupResolver } from '@hookform/resolvers/yup'
import { InfoIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { FormErrorAlert } from '@/components/common/FormErrorAlert'
import { FormField } from '@/components/common/FormField'
import { LoadingButton } from '@/components/common/LoadingButton'
import { ModalBody, ModalContent, ModalFooter, ModalHeader } from '@/components/common/Modal'
import { PasswordInput } from '@/components/common/PasswordInput'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose } from '@/components/ui/dialog'
import { useSingleFlight } from '@/hooks/use-single-flight'
import { applyServerErrors } from '@/lib/form'
import { passwordSchema, type PasswordFormValues } from '../account.schemas'
import { useChangePasswordMutation } from '../accountApi'

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Change the signed-in user's password. The API signs out every other device; this one stays. */
export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-md">
        <ModalHeader title="Change password" description="Use at least 8 characters, with a letter and a number." />
        {/* Remounted on every opening, so passwords never linger in the form. */}
        {open && <ChangePasswordForm onDone={() => onOpenChange(false)} />}
      </ModalContent>
    </Dialog>
  )
}

const DEFAULTS: PasswordFormValues = { current_password: '', password: '', password_confirmation: '' }

function ChangePasswordForm({ onDone }: { onDone: () => void }) {
  const [changePassword] = useChangePasswordMutation()
  const form = useForm<PasswordFormValues>({
    resolver: yupResolver(passwordSchema),
    defaultValues: DEFAULTS,
    mode: 'onTouched',
  })
  const { control } = form
  const { errors } = form.formState

  const [pendingValues, setPendingValues] = useState<PasswordFormValues | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Ignores a second click that lands before the button has re-rendered as disabled.
  const save = useSingleFlight(async (values: PasswordFormValues) => {
    setIsSaving(true)
    try {
      await changePassword(values).unwrap()
      toast.success('Your password was changed.', { description: 'Other devices were signed out.' })
      onDone()
    } catch (error) {
      // e.g. "The current password is incorrect." lands under that field.
      setIsConfirmOpen(false)
      applyServerErrors(error, form.setError)
    } finally {
      setIsSaving(false)
    }
  })

  return (
    <form
      onSubmit={form.handleSubmit((values) => {
        setPendingValues(values)
        setIsConfirmOpen(true)
      })}
      noValidate
      className="flex min-h-0 flex-1 flex-col"
    >
      <ModalBody className="flex flex-col gap-5">
        <FormErrorAlert title="Couldn't change your password" message={errors.root?.server?.message} />
        <FormField
          control={control}
          name="current_password"
          label="Current password"
          render={(field) => <PasswordInput {...field} autoComplete="current-password" autoFocus />}
        />
        <FormField
          control={control}
          name="password"
          label="New password"
          render={(field) => <PasswordInput {...field} autoComplete="new-password" />}
        />
        <FormField
          control={control}
          name="password_confirmation"
          label="Confirm new password"
          render={(field) => <PasswordInput {...field} autoComplete="new-password" />}
        />
        <Alert>
          <InfoIcon />
          <AlertDescription>You'll stay signed in here. Any other phone or computer will be signed out.</AlertDescription>
        </Alert>
      </ModalBody>

      <ModalFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={isSaving}>
            Cancel
          </Button>
        </DialogClose>
        <LoadingButton type="submit" isLoading={isSaving} className="ml-2">
          Change password
        </LoadingButton>
      </ModalFooter>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Change your password?"
        description="You'll use the new password next time you sign in, and your other devices will be signed out."
        confirmLabel="Yes, change password"
        isLoading={isSaving}
        onConfirm={() => pendingValues && void save(pendingValues)}
      />
    </form>
  )
}
