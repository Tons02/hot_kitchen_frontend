import { ShapesIcon } from 'lucide-react'
import { useState, type ComponentProps } from 'react'
import { FileInput } from '@/components/common/FileInput'
import { ImagePreviewDialog, type ImagePreview } from '@/components/common/ImagePreviewDialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useFilePreview } from '@/hooks/use-file-preview'
import { CATEGORY_IMAGE_TYPES } from '../productCategories.constants'

type ProductCategoryImageInputProps = Omit<ComponentProps<typeof FileInput>, 'accept' | 'placeholder'> & {
  /** The image already on record, when editing. */
  currentUrl?: string
}

/** Preview of the chosen (or current) image, next to the file picker. Click the preview to enlarge it. */
export function ProductCategoryImageInput({ currentUrl, ...fileInputProps }: ProductCategoryImageInputProps) {
  const previewUrl = useFilePreview(fileInputProps.value)
  const src = previewUrl ?? currentUrl
  const [preview, setPreview] = useState<ImagePreview | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const image = (
    <Avatar className="size-16 rounded-md after:rounded-md">
      {src && <AvatarImage src={src} alt="" className="rounded-md object-cover" />}
      <AvatarFallback className="rounded-md">
        <ShapesIcon className="size-6" aria-hidden="true" />
      </AvatarFallback>
    </Avatar>
  )

  return (
    <div className="flex items-center gap-4">
      {src ? (
        <button
          type="button"
          className="shrink-0 rounded-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          aria-label="View image larger"
          onClick={() => {
            setPreview({ src, title: previewUrl ? 'New image' : 'Current image' })
            setIsPreviewOpen(true)
          }}
        >
          {image}
        </button>
      ) : (
        <div className="shrink-0">{image}</div>
      )}
      <FileInput
        {...fileInputProps}
        accept={CATEGORY_IMAGE_TYPES.join(',')}
        placeholder={currentUrl ? 'Current image' : 'No image'}
        className="min-w-0 flex-1"
      />
      <ImagePreviewDialog image={preview} open={isPreviewOpen} onOpenChange={setIsPreviewOpen} />
    </div>
  )
}
