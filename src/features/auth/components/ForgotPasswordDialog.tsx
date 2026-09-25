import { KeyRoundIcon } from 'lucide-react'
import { ModalBody, ModalContent, ModalFooter, ModalHeader } from '@/components/common/Modal'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogTrigger } from '@/components/ui/dialog'

const LINK_CLASS =
  'rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none'

/**
 * "Forgot password?" and what to do about it. The API has no password-reset endpoint yet, so this
 * explains how to get help; swap the body for a reset form once one exists.
 */
export function ForgotPasswordDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className={LINK_CLASS}>
          Forgot password?
        </button>
      </DialogTrigger>
      <ModalContent className="sm:max-w-md">
        <ModalHeader title="Forgot your password?" />
        <ModalBody className="flex gap-3">
          <KeyRoundIcon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div className="space-y-2 text-sm">
            <p>Resetting your password online isn't available yet.</p>
            <p className="text-muted-foreground">
              Customers: contact the store you order from and they'll help you get back in. Staff: ask your
              administrator to reset your password.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <DialogClose asChild>
            <Button className="rounded-full">Got it</Button>
          </DialogClose>
        </ModalFooter>
      </ModalContent>
    </Dialog>
  )
}
