import { useAppDispatch } from '@/app/hooks'
import type { StoreBackgroundImage, StoreImageChanges, StoreImageStep, StoreImageStepStatus } from '../stores.types'
import { planStoreImageSteps } from '../stores.utils'
import {
  LIST_ID,
  storesApi,
  useAddStoreBackgroundImageMutation,
  useDeleteStoreBackgroundImageMutation,
  useUpdateStoreBackgroundImageMutation,
  useUploadStoreLogoMutation,
} from '../storesApi'

export type SaveStoreImagesResult =
  | { ok: true }
  /** Stopped at a failed request. Everything before it was saved; nothing after it ran. */
  | { ok: false; error: unknown; completed: number; total: number }

/**
 * Applies the form's image changes after the store itself has saved, one request at a time
 * (see `planStoreImageSteps`). Stops at the first failure, because later layer moves depend on
 * earlier ones. Reports each image's status through `onProgress` so the form can show spinners.
 */
export function useSaveStoreImages() {
  const dispatch = useAppDispatch()
  const [uploadLogo] = useUploadStoreLogoMutation()
  const [addImage] = useAddStoreBackgroundImageMutation()
  const [updateImage] = useUpdateStoreBackgroundImageMutation()
  const [removeImage] = useDeleteStoreBackgroundImageMutation()

  const runStep = (storeId: number, step: StoreImageStep): Promise<unknown> => {
    switch (step.kind) {
      case 'logo':
        return uploadLogo({ storeId, logo: step.file }).unwrap()
      case 'remove':
        return removeImage({ storeId, imageId: step.imageId }).unwrap()
      case 'park':
        return updateImage({ storeId, imageId: step.imageId, layer: step.layer }).unwrap()
      case 'update':
        return updateImage({ storeId, imageId: step.imageId, layer: step.layer, image: step.file }).unwrap()
      case 'add':
        return addImage({ storeId, image: step.file, layer: step.layer }).unwrap()
    }
  }

  return async (
    storeId: number,
    saved: StoreBackgroundImage[],
    changes: StoreImageChanges,
    onProgress: (key: string, status: StoreImageStepStatus) => void,
  ): Promise<SaveStoreImagesResult> => {
    const steps = planStoreImageSteps(saved, changes)
    if (steps.length === 0) return { ok: true }

    for (const step of steps) onProgress(step.key, 'pending')

    try {
      for (const [index, step] of steps.entries()) {
        onProgress(step.key, 'working')
        try {
          await runStep(storeId, step)
        } catch (error) {
          onProgress(step.key, 'failed')
          return { ok: false, error, completed: index, total: steps.length }
        }
        // An image that's parked first has another step later; it's only done after that one.
        const hasMoreSteps = steps.slice(index + 1).some((later) => later.key === step.key)
        onProgress(step.key, hasMoreSteps ? 'pending' : 'done')
      }
      return { ok: true }
    } finally {
      // One refresh for the whole save, whether it finished or stopped part-way.
      dispatch(
        storesApi.util.invalidateTags([
          { type: 'Stores', id: storeId },
          { type: 'Stores', id: LIST_ID.current },
        ]),
      )
    }
  }
}
