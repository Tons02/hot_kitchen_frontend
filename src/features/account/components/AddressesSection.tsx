import { EllipsisIcon, MapPinIcon, PencilIcon, PhoneIcon, PlusIcon, StarIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { ADDRESS_LABELS, MAX_ADDRESSES } from '../account.constants'
import type { AddressAction, UserAddress } from '../account.types'
import { formatAddress } from '../account.utils'
import { useGetAddressesQuery } from '../accountApi'
import { AddressActionDialogs } from './AddressActionDialogs'
import { AddressFormDialog, type AddressFormTarget } from './AddressFormDialog'

/** The customer's saved delivery addresses: the default first, each with edit, default and delete. */
export function AddressesSection() {
  const { data: addresses, isLoading, isError, error, refetch } = useGetAddressesQuery()
  const count = addresses?.length ?? 0
  const isFull = count >= MAX_ADDRESSES

  const [formTarget, setFormTarget] = useState<AddressFormTarget | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<AddressAction | null>(null)
  const [isActionOpen, setIsActionOpen] = useState(false)

  const openForm = (target: AddressFormTarget) => {
    setFormTarget(target)
    setIsFormOpen(true)
  }

  const handleAction = (action: AddressAction) => {
    if (action.type === 'edit') {
      openForm({ mode: 'edit', address: action.address })
      return
    }
    setPendingAction(action)
    setIsActionOpen(true)
  }

  return (
    <section aria-labelledby="addresses-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 id="addresses-heading" className="font-heading text-xl font-semibold">
            Addresses
          </h2>
          <p className="text-sm text-muted-foreground">
            Where riders deliver your orders.{' '}
            {addresses && `${count} of ${MAX_ADDRESSES} saved.`}
          </p>
        </div>
        <Button
          className="rounded-full"
          disabled={!addresses || isFull}
          title={isFull ? `You can save up to ${MAX_ADDRESSES} addresses. Delete one first.` : undefined}
          onClick={() => openForm({ mode: 'create', isFirst: count === 0 })}
        >
          <PlusIcon />
          Add address
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 2 }, (_, index) => (
            <Skeleton key={index} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState title="Couldn't load your addresses" error={error} onRetry={refetch} className="rounded-2xl border" />
      ) : count === 0 ? (
        <EmptyState
          icon={MapPinIcon}
          title="No saved addresses"
          description="Add one so checkout is quicker next time."
          className="rounded-2xl border border-dashed"
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {addresses?.map((address) => (
            <li key={address.id} className="flex">
              <AddressCard address={address} onAction={handleAction} />
            </li>
          ))}
        </ul>
      )}

      {isFull && (
        <p className="text-sm text-muted-foreground">
          You've saved the most addresses allowed ({MAX_ADDRESSES}). Delete one to add another.
        </p>
      )}

      <AddressFormDialog target={formTarget} open={isFormOpen} onOpenChange={setIsFormOpen} />
      <AddressActionDialogs action={pendingAction} open={isActionOpen} onOpenChange={setIsActionOpen} />
    </section>
  )
}

function AddressCard({ address, onAction }: { address: UserAddress; onAction: (action: AddressAction) => void }) {
  const label = ADDRESS_LABELS[address.label]

  return (
    <Card className="w-full gap-3 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full">
            {label}
          </Badge>
          {address.is_default && (
            <Badge variant="outline" className="gap-1 rounded-full">
              <StarIcon className="size-3 fill-warning text-warning" aria-hidden="true" />
              Default
            </Badge>
          )}
        </div>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${label} address`}>
              <EllipsisIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onSelect={() => onAction({ type: 'edit', address })}>
              <PencilIcon />
              Edit
            </DropdownMenuItem>
            {!address.is_default && (
              <DropdownMenuItem onSelect={() => onAction({ type: 'default', address })}>
                <StarIcon />
                Make default
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => onAction({ type: 'delete', address })}>
              <Trash2Icon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="grid gap-1.5 text-sm">
        <p className="font-medium">{address.recipient_name}</p>
        <p className="flex items-center gap-1.5 text-muted-foreground tabular-nums">
          <PhoneIcon className="size-3.5 shrink-0" aria-hidden="true" />
          {address.recipient_phone}
        </p>
        <p className="flex items-start gap-1.5 text-muted-foreground">
          <MapPinIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {formatAddress(address)}
        </p>
        {address.delivery_notes && <p className="text-xs text-muted-foreground italic">“{address.delivery_notes}”</p>}
      </div>
    </Card>
  )
}
