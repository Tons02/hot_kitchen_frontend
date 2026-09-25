import { useAppDispatch } from '@/app/hooks'
import {
  planLayeredImageSteps,
  runImageSteps,
  type ImageSaveStatus,
  type LayeredImageDraft,
  type LayeredImageStep,
  type RunImageStepsResult,
} from '@/lib/layered-images'
import type { ProductImage } from '../products.types'
import {
  LIST_ID,
  productsApi,
  useAddProductImageMutation,
  useDeleteProductImageMutation,
  useUpdateProductImageMutation,
} from '../productsApi'

/**
 * Applies the form's image changes after the product itself has saved, one request at a time
 * (see `planLayeredImageSteps`). Stops at the first failure, because later layer moves depend on
 * earlier ones. Reports each image's status through `onProgress` so the form can show spinners.
 */
export function useSaveProductImages() {
  const dispatch = useAppDispatch()
  const [addImage] = useAddProductImageMutation()
  const [updateImage] = useUpdateProductImageMutation()
  const [removeImage] = useDeleteProductImageMutation()

  const runStep = (productId: number, step: LayeredImageStep): Promise<unknown> => {
    switch (step.kind) {
      case 'remove':
        return removeImage({ productId, imageId: step.imageId }).unwrap()
      case 'park':
        return updateImage({ productId, imageId: step.imageId, layer: step.layer }).unwrap()
      case 'update':
        return updateImage({ productId, imageId: step.imageId, layer: step.layer, image: step.file }).unwrap()
      case 'add':
        return addImage({ productId, image: step.file, layer: step.layer }).unwrap()
    }
  }

  return async (
    productId: number,
    saved: ProductImage[],
    drafts: LayeredImageDraft[],
    onProgress: (key: string, status: ImageSaveStatus) => void,
  ): Promise<RunImageStepsResult> => {
    const steps = planLayeredImageSteps(saved, drafts)
    if (steps.length === 0) return { ok: true }

    try {
      return await runImageSteps(steps, (step) => runStep(productId, step), onProgress)
    } finally {
      // One refresh for the whole save, whether it finished or stopped part-way.
      dispatch(
        productsApi.util.invalidateTags([
          { type: 'Products', id: productId },
          { type: 'Products', id: LIST_ID.current },
        ]),
      )
    }
  }
}
