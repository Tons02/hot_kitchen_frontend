import { GripVerticalIcon, ImagePlusIcon, RefreshCwIcon, XIcon } from 'lucide-react'
import { useRef, useState, type Ref } from 'react'
import { ImagePreviewDialog, type ImagePreview } from '@/components/common/ImagePreviewDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sortable, SortableContent, SortableItem, SortableItemHandle, SortableOverlay } from '@/components/ui/sortable'
import { useFilePreview } from '@/hooks/use-file-preview'
import { cn } from '@/lib/utils'
import { STORE_IMAGE_TYPES } from '../stores.constants'
import type { BackgroundImageDraft, StoreSaveProgress } from '../stores.types'
import { toNewBackgroundImageDraft } from '../stores.utils'
import { ImageStepStatus } from './ImageStepStatus'

const ACCEPT = STORE_IMAGE_TYPES.join(',')

interface BackgroundImagesInputProps {
  value: BackgroundImageDraft[]
  onChange: (drafts: BackgroundImageDraft[]) => void
  /** Each image's status while the form saves. */
  progress?: StoreSaveProgress
  id?: string
  name?: string
  onBlur?: () => void
  ref?: Ref<HTMLButtonElement>
  disabled?: boolean
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

/**
 * The store's background images in display order. Adding, replacing, removing and reordering
 * only change the form; the form's save sends them to the API.
 */
export function BackgroundImagesInput({
  value,
  onChange,
  progress,
  id,
  name,
  onBlur,
  ref,
  disabled,
  ...ariaProps
}: BackgroundImagesInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<ImagePreview | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const replaceAt = (index: number, file: File) =>
    onChange(
      value.map((draft, i) => {
        if (i !== index) return draft
        // A new image just swaps its file; an existing one keeps its id and sends a replacement.
        return draft.kind === 'new' ? { ...draft, file } : { ...draft, replacement: file }
      }),
    )

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        // Dragging only reorders the drafts; the new order is saved with the form.
        <Sortable value={value} onValueChange={onChange} getItemValue={getDraftKey} orientation="mixed">
          <SortableContent asChild>
            <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {value.map((draft, index) => (
                <BackgroundImageTile
                  key={draft.key}
                  draft={draft}
                  position={index + 1}
                  status={progress?.[draft.key]}
                  disabled={disabled}
                  onReplace={(file) => replaceAt(index, file)}
                  onRemove={() => onChange(value.filter((_, i) => i !== index))}
                  onPreview={(src) => {
                    setPreview({ src, title: `Background image ${index + 1}` })
                    setIsPreviewOpen(true)
                  }}
                />
              ))}
            </ol>
          </SortableContent>
          <SortableOverlay>
            {({ value: key }) => {
              const draft = value.find((item) => item.key === key)
              return draft ? <DraftThumbnail draft={draft} className="rounded-md border shadow-lg" /> : null
            }}
          </SortableOverlay>
        </Sortable>
      )}

      <Button
        ref={ref}
        id={id}
        type="button"
        variant="outline"
        className="self-start"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onBlur={onBlur}
        {...ariaProps}
      >
        <ImagePlusIcon />
        Add images
      </Button>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={ACCEPT}
        multiple
        hidden
        tabIndex={-1}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? [])
          if (files.length > 0) onChange([...value, ...files.map(toNewBackgroundImageDraft)])
          // Reset so choosing the same file again still fires a change.
          event.target.value = ''
        }}
      />

      <ImagePreviewDialog image={preview} open={isPreviewOpen} onOpenChange={setIsPreviewOpen} />
    </div>
  )
}

const getDraftKey = (draft: BackgroundImageDraft) => draft.key

/** What the draft will show once saved: its new or replacement file, else the saved image. */
function useDraftSrc(draft: BackgroundImageDraft): string | undefined {
  const filePreview = useFilePreview(draft.kind === 'new' ? draft.file : draft.replacement)
  return filePreview ?? (draft.kind === 'existing' ? draft.url : undefined)
}

/** The image alone, following the pointer while a tile is dragged. */
function DraftThumbnail({ draft, className }: { draft: BackgroundImageDraft; className?: string }) {
  const src = useDraftSrc(draft)
  return (
    <div className={cn('aspect-video overflow-hidden bg-muted', className)}>
      {src && <img src={src} alt="" className="size-full object-cover" />}
    </div>
  )
}

interface BackgroundImageTileProps {
  draft: BackgroundImageDraft
  position: number
  status: StoreSaveProgress[string] | undefined
  disabled?: boolean
  onReplace: (file: File) => void
  onRemove: () => void
  onPreview: (src: string) => void
}

function BackgroundImageTile({
  draft,
  position,
  status,
  disabled,
  onReplace,
  onRemove,
  onPreview,
}: BackgroundImageTileProps) {
  const replaceInputRef = useRef<HTMLInputElement>(null)
  const src = useDraftSrc(draft)
  const label = `background image ${position}`

  return (
    <SortableItem value={draft.key} asChild>
      <li className="overflow-hidden rounded-md border bg-card">
        <div className="relative aspect-video bg-muted">
          {src && (
            <button
              type="button"
              className="size-full focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset"
              aria-label={`View ${label} larger`}
              onClick={() => onPreview(src)}
            >
              <img src={src} alt="" className="size-full object-cover" />
            </button>
          )}
          <div className="pointer-events-none absolute top-1.5 left-1.5 flex gap-1">
            <Badge variant="secondary" className="tabular-nums">
              #{position}
            </Badge>
            {draft.kind === 'new' && <Badge>New</Badge>}
            {draft.kind === 'existing' && draft.replacement && <Badge>Replaced</Badge>}
          </div>
          <ImageStepStatus status={status} />
        </div>

        <div className="flex items-center justify-between gap-1 px-1.5 py-1">
          {/* The only drag handle, so clicking the image still opens the preview. */}
          <SortableItemHandle asChild disabled={disabled}>
            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Drag to reorder ${label}`}>
              <GripVerticalIcon />
            </Button>
          </SortableItemHandle>
          <div className="flex">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Replace ${label}`}
              disabled={disabled}
              onClick={() => replaceInputRef.current?.click()}
            >
              <RefreshCwIcon />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:text-destructive"
              aria-label={`Remove ${label}`}
              disabled={disabled}
              onClick={onRemove}
            >
              <XIcon />
            </Button>
          </div>
        </div>

        <input
          ref={replaceInputRef}
          type="file"
          accept={ACCEPT}
          hidden
          tabIndex={-1}
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) onReplace(file)
          }}
        />
      </li>
    </SortableItem>
  )
}
