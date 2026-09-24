import type { ComponentProps, ReactNode } from 'react'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/*
 * The one modal layout: a bordered header band, a body that scrolls, and a footer that stays put.
 * Dialogs use the components below; <ConfirmDialog> applies the same classes to shadcn's AlertDialog.
 */

export const MODAL_CONTENT_CLASS = 'flex max-h-[90svh] flex-col gap-0 overflow-hidden p-0'
export const MODAL_HEADER_CLASS = 'shrink-0 gap-1 border-b px-4 py-4 pr-12 text-left sm:px-6'
export const MODAL_TITLE_CLASS = 'font-heading text-lg'
export const MODAL_BODY_CLASS = 'min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6'
/** shadcn's footers pull themselves out with -mx-4/-mb-4 to meet a padded dialog; these dialogs have no padding. */
export const MODAL_FOOTER_CLASS = 'mx-0 mb-0 shrink-0 px-4 py-4 sm:px-6'

export function ModalContent({ className, ...props }: ComponentProps<typeof DialogContent>) {
  return <DialogContent className={cn(MODAL_CONTENT_CLASS, className)} {...props} />
}

export function ModalHeader({ title, description }: { title: ReactNode; description?: ReactNode }) {
  return (
    <DialogHeader className={MODAL_HEADER_CLASS}>
      <DialogTitle className={MODAL_TITLE_CLASS}>{title}</DialogTitle>
      {description && <DialogDescription>{description}</DialogDescription>}
    </DialogHeader>
  )
}

export function ModalBody({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn(MODAL_BODY_CLASS, className)} {...props} />
}

export function ModalFooter({ className, ...props }: ComponentProps<typeof DialogFooter>) {
  return <DialogFooter className={cn(MODAL_FOOTER_CLASS, className)} {...props} />
}
