import { useState } from 'react'
import { toast } from 'sonner'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { ModalContent, ModalHeader } from '@/components/common/Modal'
import { Dialog } from '@/components/ui/dialog'
import { isInlineApiError, normalizeApiError } from '@/services/api/apiError'
import { useSaveStoreImages, type SaveStoreImagesResult } from '../hooks/useSaveStoreImages'
import type { StoreBackgroundImage, StoreImageChanges, StoreImageStepStatus, StorePayload } from '../stores.types'
import { useCreateStoreMutation, useGetStoreQuery, useUpdateStoreMutation } from '../storesApi'
import { StoreForm } from './StoreForm'

export type StoreFormTarget = { mode: 'create' } | { mode: 'edit'; storeId: number }

type ImageProgressHandler = (key: string, status: StoreImageStepStatus) => void

interface StoreFormDialogProps {
  /** Kept after closing so the content doesn't blank out during the exit animation. */
  target: StoreFormTarget | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Toasts the outcome once the store itself saved: all done, or stopped part-way through the images. */
function toastSaveResult(storeName: string, successMessage: string, result: SaveStoreImagesResult) {
  if (result.ok) {
    toast.success(successMessage)
    return
  }
  // Network and server errors were already toasted by the global error middleware.
  const error = normalizeApiError(result.error)
  const reason = isInlineApiError(error) ? `${error.message} ` : ''
  toast.error(`${storeName} was saved, but not all image changes were.`, {
    description: `${reason}${result.completed} of ${result.total} image changes went through. Open the store to check its images.`,
  })
}

export function StoreFormDialog({ target, open, onOpenChange }: StoreFormDialogProps) {
  const [isSaving, setIsSaving] = useState(false)
  const close = () => onOpenChange(false)

  return (
    // Refuses to close mid-save (Esc, the X, clicking outside), which would hide the progress.
    <Dialog open={open} onOpenChange={(next) => (next || !isSaving) && onOpenChange(next)}>
      <ModalContent className="sm:max-w-3xl" showCloseButton={!isSaving}>
        {target?.mode === 'create' && <CreateStoreContent onDone={close} onSavingChange={setIsSaving} />}
        {/* Keyed so switching stores starts a fresh form. */}
        {target?.mode === 'edit' && (
          <EditStoreContent key={target.storeId} storeId={target.storeId} onDone={close} onSavingChange={setIsSaving} />
        )}
      </ModalContent>
    </Dialog>
  )
}

interface ContentProps {
  onDone: () => void
  onSavingChange: (isSaving: boolean) => void
}

const NO_IMAGES: StoreBackgroundImage[] = []

function CreateStoreContent({ onDone, onSavingChange }: ContentProps) {
  const [createStore] = useCreateStoreMutation()
  const saveImages = useSaveStoreImages()

  const handleSubmit = async (payload: StorePayload, images: StoreImageChanges, onImageProgress: ImageProgressHandler) => {
    // Rejects on validation errors, which the form shows inline. Nothing else has run yet.
    const store = await createStore(payload).unwrap()
    const result = await saveImages(store.id, NO_IMAGES, images, onImageProgress)
    toastSaveResult(store.name, `${store.name} was added.`, result)
    onDone()
  }

  return (
    <>
      <ModalHeader title="Add store" description="Create a branch. Staff can be assigned to it once it's saved." />
      <StoreForm submitLabel="Create store" onSubmit={handleSubmit} onSavingChange={onSavingChange} />
    </>
  )
}

function EditStoreContent({ storeId, onDone, onSavingChange }: ContentProps & { storeId: number }) {
  // Always load fresh, so the form never starts from an outdated copy.
  const { data: store, isLoading, error, refetch } = useGetStoreQuery(storeId, { refetchOnMountOrArgChange: true })
  const [updateStore] = useUpdateStoreMutation()
  const saveImages = useSaveStoreImages()

  if (isLoading) {
    return (
      <>
        <ModalHeader title="Edit store" description="Loading its details." />
        <LoadingState label="Loading store…" className="min-h-64" />
      </>
    )
  }

  if (error || !store) {
    return (
      <>
        <ModalHeader title="Edit store" description="Its details couldn't be loaded." />
        <ErrorState title="Couldn't load this store" error={error} onRetry={refetch} className="min-h-64" />
      </>
    )
  }

  const handleSubmit = async (payload: StorePayload, images: StoreImageChanges, onImageProgress: ImageProgressHandler) => {
    // Details first: if they fail validation, no image has been touched yet.
    const updated = await updateStore({ id: store.id, payload }).unwrap()
    const result = await saveImages(store.id, store.background_images ?? NO_IMAGES, images, onImageProgress)
    toastSaveResult(updated.name, `Changes to ${updated.name} were saved.`, result)
    onDone()
  }

  return (
    <>
      <ModalHeader title={`Edit ${store.name}`} description={store.code} />
      <StoreForm store={store} submitLabel="Save changes" onSubmit={handleSubmit} onSavingChange={onSavingChange} />
    </>
  )
}
