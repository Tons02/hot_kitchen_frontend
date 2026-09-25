import { StoreIcon } from 'lucide-react'
import { useState, type ComponentProps } from 'react'
import { FileInput } from '@/components/common/FileInput'
import { ImageStepStatus } from '@/components/common/ImageStepStatus'
import { ImagePreviewDialog, type ImagePreview } from '@/components/common/ImagePreviewDialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useFilePreview } from '@/hooks/use-file-preview'
import type { ImageSaveStatus } from '@/lib/layered-images'
import { STORE_IMAGE_TYPES } from '../stores.constants'

type StoreLogoInputProps = Omit<ComponentProps<typeof FileInput>, 'accept' | 'placeholder'> & {
  /** The logo already on record, when editing. */
  currentUrl?: string
  /** Shown when there's no logo to display. */
  initials: string
  /** The logo's upload status while the form saves. */
  status?: ImageSaveStatus
}

/** Preview of the chosen (or current) logo, next to the file picker. Click the preview to enlarge it. */
export function StoreLogoInput({ currentUrl, initials, status, ...fileInputProps }: StoreLogoInputProps) {
  const previewUrl = useFilePreview(fileInputProps.value)
  const src = previewUrl ?? currentUrl
  const [preview, setPreview] = useState<ImagePreview | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const logo = (
    <Avatar className="size-16 rounded-md after:rounded-md">
      {src && <AvatarImage src={src} alt="" className="rounded-md" />}
      <AvatarFallback className="rounded-md text-lg">{initials || <StoreIcon className="size-6" />}</AvatarFallback>
    </Avatar>
  )

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0 overflow-hidden rounded-md">
        {src ? (
          <button
            type="button"
            className="block rounded-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            aria-label="View logo larger"
            onClick={() => {
              setPreview({ src, title: previewUrl ? 'New logo' : 'Current logo' })
              setIsPreviewOpen(true)
            }}
          >
            {logo}
          </button>
        ) : (
          logo
        )}
        {status === 'working' && <ImageStepStatus status={status} />}
      </div>
      <FileInput
        {...fileInputProps}
        accept={STORE_IMAGE_TYPES.join(',')}
        placeholder={currentUrl ? 'Current logo' : 'No logo'}
        className="min-w-0 flex-1"
      />
      <ImagePreviewDialog image={preview} open={isPreviewOpen} onOpenChange={setIsPreviewOpen} />
    </div>
  )
}
