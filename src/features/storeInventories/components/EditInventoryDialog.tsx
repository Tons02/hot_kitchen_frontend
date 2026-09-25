import { yupResolver } from '@hookform/resolvers/yup'
import { useState, type ReactNode } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ErrorState } from '@/components/common/ErrorState'
import { FormErrorAlert } from '@/components/common/FormErrorAlert'
import { FormField } from '@/components/common/FormField'
import { LoadingButton } from '@/components/common/LoadingButton'
import { LoadingState } from '@/components/common/LoadingState'
import { ModalBody, ModalContent, ModalFooter, ModalHeader } from '@/components/common/Modal'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useSingleFlight } from '@/hooks/use-single-flight'
import { applyServerErrors } from '@/lib/form'
import { editInventorySchema, type EditInventoryFormValues } from '../storeInventories.schemas'
import type { StoreInventory } from '../storeInventories.types'
import { getEditInventoryDefaults, getInventoryName, toUpdateInventoryPayload } from '../storeInventories.utils'
import { useGetStoreInventoryQuery, useUpdateStoreInventoryMutation } from '../storeInventoriesApi'

export interface EditInventoryTarget {
  storeId: number
  inventoryId: number
}

interface EditInventoryDialogProps {
  /** Kept after closing so the content doesn't blank out during the exit animation. */
  target: EditInventoryTarget | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditInventoryDialog({ target, open, onOpenChange }: EditInventoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-lg">
        {/* Keyed so switching records starts a fresh form. */}
        {target && <EditInventoryContent key={target.inventoryId} target={target} onDone={() => onOpenChange(false)} />}
      </ModalContent>
    </Dialog>
  )
}

function EditInventoryContent({ target, onDone }: { target: EditInventoryTarget; onDone: () => void }) {
  // Always load fresh: orders may have reserved stock since the list was loaded.
  const { data: inventory, isLoading, error, refetch } = useGetStoreInventoryQuery(target, {
    refetchOnMountOrArgChange: true,
  })

  if (isLoading) {
    return (
      <>
        <ModalHeader title="Edit inventory" description="Loading the latest quantities." />
        <LoadingState label="Loading inventory…" className="min-h-64" />
      </>
    )
  }

  if (error || !inventory) {
    return (
      <>
        <ModalHeader title="Edit inventory" description="This record couldn't be loaded." />
        <ErrorState title="Couldn't load this inventory" error={error} onRetry={refetch} className="min-h-64" />
      </>
    )
  }

  return (
    <>
      <ModalHeader title="Edit inventory" description={getInventoryName(inventory)} />
      <EditInventoryForm storeId={target.storeId} inventory={inventory} onDone={onDone} />
    </>
  )
}

function EditInventoryForm({ storeId, inventory, onDone }: { storeId: number; inventory: StoreInventory; onDone: () => void }) {
  const [updateInventory] = useUpdateStoreInventoryMutation()
  const reserved = inventory.reserved_quantity

  const form = useForm<EditInventoryFormValues>({
    resolver: yupResolver(editInventorySchema),
    defaultValues: getEditInventoryDefaults(inventory),
    context: { reserved },
  })
  const { control } = form
  const { errors } = form.formState
  const stockValue = useWatch({ control, name: 'stock_quantity' })
  const stock = /^\d+$/.test(stockValue) ? Number(stockValue) : null
  // What will be available after saving, with the API's formula (never below 0).
  const available = stock === null ? null : Math.max(0, stock - reserved)

  const [pendingValues, setPendingValues] = useState<EditInventoryFormValues | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Ignores a second click that lands before the button has re-rendered as disabled.
  const save = useSingleFlight(async (values: EditInventoryFormValues) => {
    setIsSaving(true)
    try {
      await updateInventory({ storeId, inventoryId: inventory.id, payload: toUpdateInventoryPayload(values) }).unwrap()
      toast.success(`${getInventoryName(inventory)} was updated.`)
      onDone()
    } catch (error) {
      // Back to the form, where the API's message shows (e.g. stock below reserved).
      setIsConfirmOpen(false)
      applyServerErrors(error, form.setError)
    } finally {
      setIsSaving(false)
    }
  })

  const changes = pendingValues ? describeChanges(inventory, pendingValues) : []

  return (
    <form
      onSubmit={form.handleSubmit((values) => {
        setPendingValues(values)
        setIsConfirmOpen(true)
      })}
      noValidate
      className="flex min-h-0 flex-1 flex-col"
    >
      <ModalBody className="flex flex-col gap-5">
        <FormErrorAlert title="Couldn't save this inventory" message={errors.root?.server?.message} />

        <FormField
          control={control}
          name="stock_quantity"
          label="Current stock"
          description={`Everything on hand, including the ${reserved.toLocaleString()} reserved.`}
          render={(field) => <Input {...field} inputMode="numeric" />}
        />

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Readout label="Reserved">
            {reserved.toLocaleString()}
            <span className="block text-xs font-normal text-muted-foreground">Held by open orders</span>
          </Readout>
          <Readout label="Available after saving">{available === null ? '—' : available.toLocaleString()}</Readout>
        </dl>

        <FormField
          control={control}
          name="low_stock_threshold"
          label="Low-stock threshold"
          optional
          description="Flag it as low stock at or below this many available. Leave empty to never flag it."
          render={(field) => <Input {...field} inputMode="numeric" placeholder="10" />}
        />
      </ModalBody>

      <ModalFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={isSaving}>
            Cancel
          </Button>
        </DialogClose>
        <LoadingButton type="submit" isLoading={isSaving} className="ml-2">
          Save changes
        </LoadingButton>
      </ModalFooter>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Save inventory changes?"
        description={changes.length === 0 ? 'Nothing changed. Saving keeps the record as it is.' : getInventoryName(inventory)}
        confirmLabel="Yes, save changes"
        isLoading={isSaving}
        onConfirm={() => pendingValues && void save(pendingValues)}
      >
        {changes.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {changes.map((change) => (
              <li key={change}>{change}</li>
            ))}
          </ul>
        )}
      </ConfirmDialog>
    </form>
  )
}

/** "Stock: 50 → 40", "Low-stock threshold: 10 → not set". */
function describeChanges(inventory: StoreInventory, values: EditInventoryFormValues): string[] {
  const payload = toUpdateInventoryPayload(values)
  const show = (value: number | null) => (value === null ? 'not set' : value.toLocaleString())

  return [
    payload.stock_quantity !== inventory.stock_quantity
      ? `Stock: ${show(inventory.stock_quantity)} → ${show(payload.stock_quantity)}`
      : '',
    payload.low_stock_threshold !== inventory.low_stock_threshold
      ? `Low-stock threshold: ${show(inventory.low_stock_threshold)} → ${show(payload.low_stock_threshold)}`
      : '',
  ].filter(Boolean)
}

function Readout({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border bg-muted/40 px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-heading text-lg font-semibold tabular-nums">{children}</dd>
    </div>
  )
}
