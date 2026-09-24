import type { ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { LoadingButton } from './LoadingButton'
import {
  MODAL_BODY_CLASS,
  MODAL_CONTENT_CLASS,
  MODAL_FOOTER_CLASS,
  MODAL_HEADER_CLASS,
  MODAL_TITLE_CLASS,
} from './Modal'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  /** Keeps the dialog open and disables its buttons while the action runs. */
  isLoading?: boolean
  /** The caller closes the dialog (via `onOpenChange`) once the action succeeds. */
  onConfirm: () => void
  /** Extra content under the description, e.g. a list of what's about to change. */
  children?: ReactNode
}

/** A yes/no confirmation in the standard modal layout (see Modal.tsx). */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isLoading = false,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !isLoading && onOpenChange(next)}>
      <AlertDialogContent
        className={cn(MODAL_CONTENT_CLASS, 'sm:max-w-md data-[size=default]:max-w-[calc(100%-2rem)] data-[size=default]:sm:max-w-md')}
        {...(description ? {} : { 'aria-describedby': undefined })}
      >
        <AlertDialogHeader className={cn(MODAL_HEADER_CLASS, 'place-items-start')}>
          <AlertDialogTitle className={MODAL_TITLE_CLASS}>{title}</AlertDialogTitle>
        </AlertDialogHeader>
        {(description || children) && (
          <div className={cn(MODAL_BODY_CLASS, 'flex flex-col gap-4')}>
            {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
            {children}
          </div>
        )}
        <AlertDialogFooter className={MODAL_FOOTER_CLASS}>
          <AlertDialogCancel disabled={isLoading}>{cancelLabel}</AlertDialogCancel>
          {/* A plain button instead of AlertDialogAction, which would close the dialog before the action finishes. */}
          <LoadingButton variant={variant} isLoading={isLoading} onClick={onConfirm}>
            {confirmLabel}
          </LoadingButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
