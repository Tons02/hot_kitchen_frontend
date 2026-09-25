import { useAppDispatch } from '@/app/hooks'
import { runImageSteps, type ImageSaveStatus, type RunImageStepsResult } from '@/lib/layered-images'
import type { StoreBackgroundImage, StoreImageChanges, StoreImageStep } from '../stores.types'
import { planStoreImageSteps } from '../stores.utils'
import {
  LIST_ID,
  storesApi,
  useAddStoreBackgroundImageMutation,
  useDeleteStoreBackgroundImageMutation,
  useUpdateStoreBackgroundImageMutation,
  useUploadStoreLogoMutation,
} from '../storesApi'

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
    onProgress: (key: string, status: ImageSaveStatus) => void,
  ): Promise<RunImageStepsResult> => {
    const steps = planStoreImageSteps(saved, changes)
    if (steps.length === 0) return { ok: true }

    try {
      return await runImageSteps(steps, (step) => runStep(storeId, step), onProgress)
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
