import tableLoadingAnimation from '@/assets/tableLoading.json'
import { LottieAnimation } from '@/components/common/LottieAnimation'

/** Shown in the table body while rows load. */
export function DataTableLoadingState({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-1 px-6 py-10 text-sm text-muted-foreground"
    >
      <LottieAnimation animationData={tableLoadingAnimation} className="size-28" />
      <span>{label}</span>
    </div>
  )
}
