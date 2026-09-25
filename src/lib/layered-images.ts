/*
 * Ordered image galleries saved one request at a time, e.g. a store's background images or a
 * product's photos. The API keeps each image on a numbered layer (unique per owner), with endpoints
 * to add one, change one's file and/or layer, and remove one. The form edits a list of drafts; on
 * save, `planLayeredImageSteps` turns the difference into those requests and `runImageSteps` sends them.
 */

/** A saved image as the API returns it. */
export interface LayeredImage {
  id: number
  image_url: string
  /** Display order, starting at 1. */
  layer: number
}

/**
 * One image in the form, in display order. Nothing is sent until the form is saved: existing images
 * can get a replacement file or be dropped from the list (removed), new ones are uploaded, and every
 * image ends up on the layer matching its position (1, 2, 3, ...).
 */
export type LayeredImageDraft =
  | { key: string; kind: 'existing'; id: number; url: string; layer: number; replacement: File | null }
  | { key: string; kind: 'new'; file: File }

/**
 * One request in saving the images, run in order. `key` names the draft it belongs to, so the form
 * can show a spinner on that image while it runs.
 */
export type LayeredImageStep =
  | { kind: 'remove'; key: string; imageId: number }
  /** Parks an image on a spare layer so another can take its old one (layers must be unique). */
  | { kind: 'park'; key: string; imageId: number; layer: number }
  | { kind: 'update'; key: string; imageId: number; layer?: number; file?: File }
  | { kind: 'add'; key: string; file: File; layer: number }

export type ImageSaveStatus = 'pending' | 'working' | 'done' | 'failed'

/** Status per draft key while the form saves, e.g. { 'existing-7': 'working' }. */
export type ImageSaveProgress = Record<string, ImageSaveStatus>

export interface LayeredImageChangeSummary {
  added: number
  replaced: number
  removed: number
  reordered: boolean
}

export type RunImageStepsResult =
  | { ok: true }
  /** Stopped at a failed request. Everything before it was saved; nothing after it ran. */
  | { ok: false; error: unknown; completed: number; total: number }

/** The saved images as form drafts, in layer order. */
export function getLayeredImageDrafts(images: LayeredImage[] | undefined): LayeredImageDraft[] {
  return [...(images ?? [])]
    .sort((a, b) => a.layer - b.layer)
    .map((image) => ({
      key: `existing-${image.id}`,
      kind: 'existing',
      id: image.id,
      url: image.image_url,
      layer: image.layer,
      replacement: null,
    }))
}

let newDraftCount = 0

export function toNewLayeredImageDraft(file: File): LayeredImageDraft {
  newDraftCount += 1
  return { key: `new-${newDraftCount}`, kind: 'new', file }
}

/** The files the drafts would upload: new images and replacements. For validating type and size. */
export function getLayeredImageDraftFiles(drafts: LayeredImageDraft[]): File[] {
  return drafts.flatMap((draft) => {
    if (draft.kind === 'new') return [draft.file]
    return draft.replacement ? [draft.replacement] : []
  })
}

/**
 * The requests that turn the saved images into the drafts, one at a time:
 * 1. remove images dropped from the list (frees their layers)
 * 2. park every image that changes layer on a spare one, since two images can't share a layer
 * 3. move each image to its final layer (1, 2, 3, ...), sending its replacement file in the same call
 * 4. upload new images straight onto their layers
 */
export function planLayeredImageSteps(
  saved: Pick<LayeredImage, 'id' | 'layer'>[],
  drafts: LayeredImageDraft[],
): LayeredImageStep[] {
  const steps: LayeredImageStep[] = []

  const keptIds = new Set(drafts.flatMap((draft) => (draft.kind === 'existing' ? [draft.id] : [])))
  for (const image of saved) {
    if (!keptIds.has(image.id)) steps.push({ kind: 'remove', key: `existing-${image.id}`, imageId: image.id })
  }

  const targets = drafts.map((draft, index) => ({ draft, layer: index + 1 }))
  // Above every layer in use now and every final layer, so a parked image never blocks one.
  const firstSpareLayer = Math.max(drafts.length, ...saved.map((image) => image.layer)) + 1

  let parked = 0
  for (const { draft, layer } of targets) {
    if (draft.kind === 'existing' && draft.layer !== layer) {
      steps.push({ kind: 'park', key: draft.key, imageId: draft.id, layer: firstSpareLayer + parked })
      parked += 1
    }
  }

  for (const { draft, layer } of targets) {
    if (draft.kind !== 'existing') continue
    const moves = draft.layer !== layer
    if (moves || draft.replacement) {
      steps.push({
        kind: 'update',
        key: draft.key,
        imageId: draft.id,
        layer: moves ? layer : undefined,
        file: draft.replacement ?? undefined,
      })
    }
  }

  for (const { draft, layer } of targets) {
    if (draft.kind === 'new') steps.push({ kind: 'add', key: draft.key, file: draft.file, layer })
  }

  return steps
}

/** What saving will do to the images, for the confirmation step. */
export function summarizeLayeredImageChanges(
  saved: Pick<LayeredImage, 'id'>[],
  drafts: LayeredImageDraft[],
): LayeredImageChangeSummary {
  const kept = drafts.filter((draft) => draft.kind === 'existing')

  return {
    added: drafts.filter((draft) => draft.kind === 'new').length,
    replaced: kept.filter((draft) => draft.replacement).length,
    removed: saved.length - kept.length,
    reordered: drafts.some((draft, index) => draft.kind === 'existing' && draft.layer !== index + 1),
  }
}

/** The multipart body for adding or updating one image. Leaves out what isn't changing. */
export function toLayeredImageFormData({ image, layer }: { image?: File; layer?: number }): FormData {
  const body = new FormData()
  if (image) body.append('image', image)
  if (layer !== undefined) body.append('layer', String(layer))
  return body
}

/**
 * Runs the steps one at a time, stopping at the first failure because later layer moves depend on
 * earlier ones. Reports each draft's status through `onProgress` so the form can show spinners.
 */
export async function runImageSteps<TStep extends { key: string }>(
  steps: TStep[],
  runStep: (step: TStep) => Promise<unknown>,
  onProgress: (key: string, status: ImageSaveStatus) => void,
): Promise<RunImageStepsResult> {
  for (const step of steps) onProgress(step.key, 'pending')

  for (const [index, step] of steps.entries()) {
    onProgress(step.key, 'working')
    try {
      await runStep(step)
    } catch (error) {
      onProgress(step.key, 'failed')
      return { ok: false, error, completed: index, total: steps.length }
    }
    // An image that's parked first has another step later; it's only done after that one.
    const hasMoreSteps = steps.slice(index + 1).some((later) => later.key === step.key)
    onProgress(step.key, hasMoreSteps ? 'pending' : 'done')
  }

  return { ok: true }
}
