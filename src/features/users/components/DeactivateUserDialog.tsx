import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { FormErrorAlert } from '@/components/common/FormErrorAlert'
import { FormField } from '@/components/common/FormField'
import { LoadingButton } from '@/components/common/LoadingButton'
import { ModalBody, ModalContent, ModalFooter, ModalHeader } from '@/components/common/Modal'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose } from '@/components/ui/dialog'
import { FieldGroup } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { useSingleFlight } from '@/hooks/use-single-flight'
import { applyServerErrors } from '@/lib/form'
import { deactivateUserSchema, type DeactivateUserFormValues } from '../users.schemas'
import type { User } from '../users.types'
import { getFullName } from '../users.utils'
import { useDeactivateUserMutation } from '../usersApi'

interface DeactivateUserDialogProps {
  user: User | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeactivateUserDialog({ user, open, onOpenChange }: DeactivateUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-md">
        {/* Keyed so the reason field starts empty for each user. */}
        {user && <DeactivateUserForm key={user.id} user={user} onDone={() => onOpenChange(false)} />}
      </ModalContent>
    </Dialog>
  )
}

function DeactivateUserForm({ user, onDone }: { user: User; onDone: () => void }) {
  const [deactivateUser] = useDeactivateUserMutation()
  const name = getFullName(user)

  const form = useForm<DeactivateUserFormValues>({
    resolver: yupResolver(deactivateUserSchema),
    defaultValues: { deactivate_reason: '' },
  })
  const { isSubmitting, errors } = form.formState

  // Ignores a second click that lands before the button has re-rendered as disabled.
  const submit = useSingleFlight(async (values: DeactivateUserFormValues) => {
    try {
      await deactivateUser({ id: user.id, deactivate_reason: values.deactivate_reason }).unwrap()
      toast.success(`${name} was deactivated.`)
      onDone()
    } catch (error) {
      applyServerErrors(error, form.setError)
    }
  })

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate className="flex min-h-0 flex-1 flex-col">
      <ModalHeader
        title={`Deactivate ${name}?`}
        description="Their account is marked as deactivated until you reactivate it. The reason is kept on their record."
      />
      <ModalBody>
        <FieldGroup>
          <FormErrorAlert title="Couldn't deactivate this user" message={errors.root?.server?.message} />
          <FormField
            control={form.control}
            name="deactivate_reason"
            label="Reason"
            render={(field) => <Textarea {...field} rows={3} placeholder="For example: resigned, end of contract" />}
          />
        </FieldGroup>
      </ModalBody>
      <ModalFooter>
        <DialogClose asChild>
          <Button variant="outline" disabled={isSubmitting}>
            Cancel
          </Button>
        </DialogClose>
        <LoadingButton type="submit" variant="destructive" isLoading={isSubmitting}>
          Deactivate
        </LoadingButton>
      </ModalFooter>
    </form>
  )
}
