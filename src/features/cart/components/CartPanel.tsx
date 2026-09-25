import { yupResolver } from '@hookform/resolvers/yup'
import { CircleAlertIcon, ShoppingBagIcon, TicketPercentIcon, Trash2Icon, UtensilsIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation } from 'react-router'
import { toast } from 'sonner'
import { object, string, type InferType } from 'yup'
import { useAppSelector } from '@/app/hooks'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingButton } from '@/components/common/LoadingButton'
import { QuantityStepper } from '@/components/common/QuantityStepper'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { selectIsAuthenticated } from '@/features/auth/authSlice'
import { useSingleFlight } from '@/hooks/use-single-flight'
import { applyServerErrors } from '@/lib/form'
import { formatPeso } from '@/lib/money'
import { ROUTES, type RedirectLocationState } from '@/routes/paths'
import { toastInlineApiError } from '@/services/api/apiErrorMiddleware'
import { MAX_LINE_QUANTITY } from '../cart.schemas'
import type { Cart, CartLine } from '../cart.types'
import {
  useApplyCartVoucherMutation,
  useClearCartMutation,
  useGetCartQuery,
  useRemoveCartItemMutation,
  useRemoveCartVoucherMutation,
  useUpdateCartItemMutation,
} from '../cartApi'

/** The cart sheet's contents: sign-in prompt, empty cart, or the lines, voucher and totals. */
export function CartPanel() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const location = useLocation()
  const { data: cart, isLoading, isError, error, refetch } = useGetCartQuery(undefined, { skip: !isAuthenticated })

  if (!isAuthenticated) {
    const state: RedirectLocationState = { from: location }
    return (
      <>
        <PanelHeader description="Sign in to start a cart." />
        <EmptyState
          icon={ShoppingBagIcon}
          title="Your cart is waiting"
          description="Sign in to add food to your cart and order."
          action={
            <Button asChild className="rounded-full">
              <Link to={ROUTES.login} state={state}>
                Sign in
              </Link>
            </Button>
          }
          className="flex-1"
        />
      </>
    )
  }

  if (isLoading) {
    return (
      <>
        <PanelHeader description="Loading your cart." />
        <div className="flex flex-col gap-3 p-4">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-20 rounded-xl" />
          ))}
        </div>
      </>
    )
  }

  if (isError || !cart) {
    return (
      <>
        <PanelHeader description="Something went wrong." />
        <ErrorState title="Couldn't load your cart" error={error} onRetry={refetch} className="flex-1" />
      </>
    )
  }

  if (cart.items.length === 0) {
    return (
      <>
        <PanelHeader description="Nothing here yet." />
        <EmptyState
          icon={ShoppingBagIcon}
          title="Your cart is empty"
          description="Choose a store and add your favorites."
          action={
            <Button asChild className="rounded-full">
              <Link to={ROUTES.shopStores}>Browse stores</Link>
            </Button>
          }
          className="flex-1"
        />
      </>
    )
  }

  return <FilledCart cart={cart} />
}

function PanelHeader({ description }: { description: string }) {
  return (
    <SheetHeader className="border-b">
      <SheetTitle>Your cart</SheetTitle>
      <SheetDescription>{description}</SheetDescription>
    </SheetHeader>
  )
}

function FilledCart({ cart }: { cart: Cart }) {
  const [clearCart, { isLoading: isClearing }] = useClearCartMutation()
  const [isClearOpen, setIsClearOpen] = useState(false)
  const count = cart.summary.item_count

  const confirmClear = useSingleFlight(async () => {
    try {
      await clearCart().unwrap()
      setIsClearOpen(false)
      toast.success('Your cart was cleared.')
    } catch (error) {
      toastInlineApiError(error)
    }
  })

  return (
    <>
      <PanelHeader description={`${count} item${count === 1 ? '' : 's'} from ${cart.store?.name ?? 'this store'}`} />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        {cart.has_issues && (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>
              Some items can't be ordered right now. Change or remove them to check out.
            </AlertDescription>
          </Alert>
        )}

        <ul className="flex flex-col divide-y">
          {cart.items.map((line) => (
            <CartLineItem key={line.id} line={line} />
          ))}
        </ul>

        <Button
          variant="ghost"
          size="sm"
          className="self-start text-destructive hover:text-destructive"
          onClick={() => setIsClearOpen(true)}
        >
          <Trash2Icon />
          Clear cart
        </Button>

        <Separator />
        <VoucherSection cart={cart} />
      </div>

      <SheetFooter className="gap-3 border-t">
        <dl className="grid grid-cols-[1fr_auto] gap-y-1 text-sm">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="text-right tabular-nums">{formatPeso(cart.summary.subtotal)}</dd>
          {Number(cart.summary.discount) > 0 && (
            <>
              <dt className="text-muted-foreground">Discount</dt>
              <dd className="text-right text-success tabular-nums">−{formatPeso(cart.summary.discount)}</dd>
            </>
          )}
          {cart.summary.free_delivery && (
            <>
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="text-right text-success">Free</dd>
            </>
          )}
          <dt className="font-heading text-base font-semibold">Total</dt>
          <dd className="text-right font-heading text-base font-semibold tabular-nums">
            {formatPeso(cart.summary.total)}
          </dd>
        </dl>
        {/* Checkout isn't built yet; it will also stay disabled while the cart has issues. */}
        <Button size="lg" className="w-full rounded-full" disabled title="Checkout is coming soon">
          {cart.has_issues ? 'Fix your cart to check out' : 'Checkout · coming soon'}
        </Button>
      </SheetFooter>

      <ConfirmDialog
        open={isClearOpen}
        onOpenChange={setIsClearOpen}
        title="Clear your cart?"
        description="Every item and the applied voucher will be removed."
        confirmLabel="Clear cart"
        variant="destructive"
        isLoading={isClearing}
        onConfirm={() => void confirmClear()}
      />
    </>
  )
}

function CartLineItem({ line }: { line: CartLine }) {
  const [updateItem, { isLoading: isUpdating }] = useUpdateCartItemMutation()
  const [removeItem, { isLoading: isRemoving }] = useRemoveCartItemMutation()
  const isBusy = isUpdating || isRemoving
  const extras = [line.variation?.name, ...line.add_ons.map((addOn) => `+ ${addOn.name}`)].filter(Boolean).join(' · ')

  const changeQuantity = async (quantity: number) => {
    try {
      await updateItem({ itemId: line.id, quantity }).unwrap()
    } catch (error) {
      // e.g. "Only 2 left in stock."
      toastInlineApiError(error)
    }
  }

  const remove = async () => {
    try {
      await removeItem(line.id).unwrap()
      toast.success(`${line.product.name} was removed.`)
    } catch (error) {
      toastInlineApiError(error)
    }
  }

  return (
    <li className="flex gap-3 py-3" aria-busy={isBusy}>
      <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
        {line.product.image_url ? (
          <img src={line.product.image_url} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <UtensilsIcon className="size-6" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium leading-tight">{line.product.name}</span>
          <Button
            variant="ghost"
            size="icon-xs"
            className="shrink-0 text-muted-foreground"
            aria-label={`Remove ${line.product.name}`}
            disabled={isBusy}
            onClick={() => void remove()}
          >
            <XIcon />
          </Button>
        </div>
        {extras && <span className="text-xs text-muted-foreground">{extras}</span>}
        {line.notes && <span className="text-xs text-muted-foreground italic">“{line.notes}”</span>}
        {line.issue && (
          <span className="flex items-center gap-1 text-xs font-medium text-destructive">
            <CircleAlertIcon className="size-3.5" aria-hidden="true" />
            {line.issue}
          </span>
        )}
        <div className="mt-1 flex items-center justify-between gap-2">
          <QuantityStepper
            size="sm"
            value={line.quantity}
            max={MAX_LINE_QUANTITY}
            label={line.product.name}
            disabled={isBusy}
            onChange={(quantity) => void changeQuantity(quantity)}
          />
          <span className="text-right text-sm font-medium tabular-nums">
            {line.on_promotion && Number(line.original_unit_price) > Number(line.unit_price) && (
              <span className="mr-1.5 text-xs text-muted-foreground line-through">
                {formatPeso(Number(line.original_unit_price) * line.quantity)}
              </span>
            )}
            {formatPeso(line.line_total)}
          </span>
        </div>
      </div>
    </li>
  )
}

const voucherCodeSchema = object({
  code: string().trim().required('Enter a voucher code.').max(50, 'Codes are at most 50 characters.'),
})

type VoucherCodeValues = InferType<typeof voucherCodeSchema>

/** Apply a voucher code, or show the applied one (and why it doesn't apply, if it doesn't). */
function VoucherSection({ cart }: { cart: Cart }) {
  const [applyVoucher] = useApplyCartVoucherMutation()
  const [removeVoucher, { isLoading: isRemoving }] = useRemoveCartVoucherMutation()
  const form = useForm<VoucherCodeValues>({ resolver: yupResolver(voucherCodeSchema), defaultValues: { code: '' } })
  const { isSubmitting, errors } = form.formState

  // Ignores a second click that lands before the button has re-rendered as disabled.
  const apply = useSingleFlight(async ({ code }: VoucherCodeValues) => {
    try {
      await applyVoucher(code.toUpperCase()).unwrap()
      form.reset()
      toast.success('Voucher applied.')
    } catch (error) {
      // e.g. "Invalid voucher code." or why it doesn't apply to this cart, shown under the field.
      applyServerErrors(error, form.setError)
    }
  })

  if (cart.voucher) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed px-3 py-2">
          <span className="flex min-w-0 items-center gap-2">
            <TicketPercentIcon className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="grid min-w-0 leading-tight">
              <span className="font-mono text-sm font-semibold">{cart.voucher.code}</span>
              <span className="truncate text-xs text-muted-foreground">{cart.voucher.name}</span>
            </span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={isRemoving}
            onClick={() => void removeVoucher().unwrap().catch(toastInlineApiError)}
          >
            Remove
          </Button>
        </div>
        {cart.voucher.error && (
          <p className="flex items-start gap-1 text-xs text-destructive">
            <CircleAlertIcon className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            {cart.voucher.error}
          </p>
        )}
      </div>
    )
  }

  const message = errors.code?.message ?? errors.root?.server?.message

  return (
    <form onSubmit={form.handleSubmit(apply)} noValidate className="flex flex-col gap-1.5">
      <label htmlFor="voucher-code" className="text-sm font-medium">
        Voucher code
      </label>
      <div className="flex gap-2">
        <Input
          id="voucher-code"
          {...form.register('code', { setValueAs: (value: string) => value.toUpperCase() })}
          placeholder="e.g. WEEKEND20"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={Boolean(message)}
          aria-describedby={message ? 'voucher-code-error' : undefined}
          className="font-mono uppercase"
        />
        <LoadingButton type="submit" variant="outline" isLoading={isSubmitting}>
          Apply
        </LoadingButton>
      </div>
      {message && (
        <p id="voucher-code-error" className="text-xs text-destructive">
          {message}
        </p>
      )}
    </form>
  )
}
