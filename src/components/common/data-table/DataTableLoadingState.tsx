import tableLoadingAnimation from '@/assets/tableLoading.json'
import { LottieAnimation } from '@/components/common/LottieAnimation'

/** Shown while rows load: just the animation. The label is read out by screen readers only. */
export function DataTableLoadingState({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center px-6 py-10">
      <LottieAnimation animationData={tableLoadingAnimation} className="size-28" />
      <span className="sr-only">{label}</span>
    </div>
  )
}
