import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { FormErrorAlert } from '@/components/common/FormErrorAlert'
import { FormField } from '@/components/common/FormField'
import { LoadingButton } from '@/components/common/LoadingButton'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldGroup } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
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
      <DialogContent>
        {/* Keyed so the reason field starts empty for each user. */}
        {user && <DeactivateUserForm key={user.id} user={user} onDone={() => onOpenChange(false)} />}
      </DialogContent>
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

  const submit = async (values: DeactivateUserFormValues) => {
    try {
      await deactivateUser({ id: user.id, deactivate_reason: values.deactivate_reason }).unwrap()
      toast.success(`${name} was deactivated.`)
      onDone()
    } catch (error) {
      applyServerErrors(error, form.setError)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Deactivate {name}?</DialogTitle>
        <DialogDescription>
          Their account is marked as deactivated until you reactivate it. The reason is kept on their record.
        </DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <FormErrorAlert title="Couldn't deactivate this user" message={errors.root?.server?.message} />
        <FormField
          control={form.control}
          name="deactivate_reason"
          label="Reason"
          render={(field) => <Textarea {...field} rows={3} placeholder="For example: resigned, end of contract" />}
        />
      </FieldGroup>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" disabled={isSubmitting}>
            Cancel
          </Button>
        </DialogClose>
        <LoadingButton type="submit" variant="destructive" isLoading={isSubmitting}>
          Deactivate
        </LoadingButton>
      </DialogFooter>
    </form>
  )
}
