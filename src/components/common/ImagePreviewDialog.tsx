import { Dialog } from '@/components/ui/dialog'
import { ModalBody, ModalContent, ModalHeader } from './Modal'

export interface ImagePreview {
  src: string
  title: string
}

interface ImagePreviewDialogProps {
  /** Kept after closing so the image doesn't blank out during the exit animation. */
  image: ImagePreview | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Shows one image as large as the screen allows, e.g. when a thumbnail is clicked. */
export function ImagePreviewDialog({ image, open, onOpenChange }: ImagePreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-5xl" aria-describedby={undefined}>
        <ModalHeader title={image?.title ?? 'Image'} />
        <ModalBody className="flex items-center justify-center bg-muted/50">
          {image && <img src={image.src} alt={image.title} className="max-h-[70svh] w-auto max-w-full rounded-md object-contain" />}
        </ModalBody>
      </ModalContent>
    </Dialog>
  )
}
