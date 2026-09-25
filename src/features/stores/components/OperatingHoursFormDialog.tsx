import { toast } from 'sonner'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { ModalContent, ModalHeader } from '@/components/common/Modal'
import { Dialog } from '@/components/ui/dialog'
import type { OperatingHourPayload, Store } from '../stores.types'
import { useGetStoreOperatingHoursQuery, useUpdateStoreOperatingHoursMutation } from '../storesApi'
import { OperatingHoursForm } from './OperatingHoursForm'

interface OperatingHoursFormDialogProps {
  /** Kept after closing so the content doesn't blank out during the exit animation. */
  store: Store | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OperatingHoursFormDialog({ store, open, onOpenChange }: OperatingHoursFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-xl">
        {/* Keyed so switching stores starts a fresh form. */}
        {store && <OperatingHoursContent key={store.id} store={store} onDone={() => onOpenChange(false)} />}
      </ModalContent>
    </Dialog>
  )
}

function OperatingHoursContent({ store, onDone }: { store: Store; onDone: () => void }) {
  // Always load fresh, so the form never starts from an outdated copy.
  const { data: hours, isLoading, error, refetch } = useGetStoreOperatingHoursQuery(store.id, {
    refetchOnMountOrArgChange: true,
  })
  const [updateHours] = useUpdateStoreOperatingHoursMutation()

  const title = `Operating hours · ${store.name}`

  if (isLoading) {
    return (
      <>
        <ModalHeader title={title} description="Loading the current schedule." />
        <LoadingState label="Loading hours…" className="min-h-64" />
      </>
    )
  }

  if (error || !hours) {
    return (
      <>
        <ModalHeader title={title} description="The current schedule couldn't be loaded." />
        <ErrorState title="Couldn't load these hours" error={error} onRetry={refetch} className="min-h-64" />
      </>
    )
  }

  const handleSubmit = async (operatingHours: OperatingHourPayload[]) => {
    await updateHours({ storeId: store.id, operatingHours }).unwrap()
    toast.success(`${store.name}'s hours were saved.`)
    onDone()
  }

  return (
    <>
      <ModalHeader title={title} description="Set when the store takes orders each day. Turn a day off to mark it closed." />
      <OperatingHoursForm storeName={store.name} hours={hours} onSubmit={handleSubmit} />
    </>
  )
}
