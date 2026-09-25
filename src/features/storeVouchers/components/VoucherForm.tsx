import { yupResolver } from '@hookform/resolvers/yup'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { FormErrorAlert } from '@/components/common/FormErrorAlert'
import { FormField } from '@/components/common/FormField'
import { FormSection } from '@/components/common/FormSection'
import { FormSwitchField } from '@/components/common/FormSwitchField'
import { LoadingButton } from '@/components/common/LoadingButton'
import { ModalBody, ModalFooter } from '@/components/common/Modal'
import { PickedItemsInput } from '@/components/common/PickedItemsInput'
import { SelectInput } from '@/components/common/SelectInput'
import { Button } from '@/components/ui/button'
import { DialogClose } from '@/components/ui/dialog'
import { FieldSeparator } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Textarea } from '@/components/ui/textarea'
import { ProductCategoryCombobox } from '@/features/productCategories/components/ProductCategoryCombobox'
import { ProductCombobox } from '@/features/products/components/ProductCombobox'
import { useSingleFlight } from '@/hooks/use-single-flight'
import { applyServerErrors } from '@/lib/form'
import { DISCOUNT_TYPE_OPTIONS, MAX_CODE_LENGTH } from '../storeVouchers.constants'
import { voucherSchema, type VoucherFormValues } from '../storeVouchers.schemas'
import type { Voucher, VoucherPayload } from '../storeVouchers.types'
import { getVoucherFormDefaults, toVoucherPayload } from '../storeVouchers.utils'
import { VoucherSaveConfirmDialog } from './VoucherSaveConfirmDialog'

interface VoucherFormProps {
  storeId: number
  storeName: string
  /** The voucher being edited. Omit to create one. */
  voucher?: Voucher
  submitLabel: string
  /** Saves the voucher. Reject (e.g. with RTK Query's `.unwrap()`) so the form can show the API's errors. */
  onSubmit: (payload: VoucherPayload) => Promise<unknown>
}

/**
 * Create or edit a voucher. Save first validates, then always asks for confirmation (showing the
 * voucher, or exactly what changes) before anything reaches the API.
 */
export function VoucherForm({ storeId, storeName, voucher, submitLabel, onSubmit }: VoucherFormProps) {
  const isEditing = voucher !== undefined
  // Once redeemed, the code is part of order history and the API locks it.
  const isCodeLocked = (voucher?.used_count ?? 0) > 0

  const form = useForm<VoucherFormValues>({
    resolver: yupResolver(voucherSchema),
    defaultValues: getVoucherFormDefaults(voucher),
    context: { isCreate: !isEditing, usedCount: voucher?.used_count ?? 0 },
    mode: 'onTouched',
  })
  const { control } = form
  const { errors } = form.formState
  const discountType = useWatch({ control, name: 'discount_type' })

  const [pendingValues, setPendingValues] = useState<VoucherFormValues | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Ignores a second click that lands before the button has re-rendered as disabled.
  const save = useSingleFlight(async (values: VoucherFormValues) => {
    setIsSaving(true)
    try {
      // On success the parent closes the whole dialog.
      await onSubmit(toVoucherPayload(values))
    } catch (error) {
      // Back to the form, where the API's errors show on the fields they belong to.
      setIsConfirmOpen(false)
      applyServerErrors(error, form.setError)
    } finally {
      setIsSaving(false)
    }
  })

  return (
    // Fills the dialog: the fields scroll, the footer stays put.
    <form
      onSubmit={form.handleSubmit((values) => {
        setPendingValues(values)
        setIsConfirmOpen(true)
      })}
      noValidate
      className="flex min-h-0 flex-1 flex-col"
    >
      <fieldset disabled={isSaving} className="contents">
        <ModalBody className="flex flex-col gap-6">
          <FormErrorAlert title="Couldn't save this voucher" message={errors.root?.server?.message} />

          <FormSection title="Voucher">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={control}
                name="name"
                label="Name"
                description="Shown to customers."
                render={(field) => <Input {...field} placeholder="Weekend treat" />}
              />
              <FormField
                control={control}
                name="code"
                label="Code"
                optional={!isEditing}
                description={
                  isCodeLocked
                    ? "It's been used, so the code can't change."
                    : isEditing
                      ? 'What customers type at checkout.'
                      : 'Leave empty to generate one, e.g. K7M2QX9A.'
                }
                render={({ onChange, ...field }) => (
                  <Input
                    {...field}
                    // Codes are case-insensitive; the API stores them uppercase.
                    onChange={(event) => onChange(event.target.value.toUpperCase().replace(/\s/g, ''))}
                    maxLength={MAX_CODE_LENGTH}
                    disabled={isCodeLocked}
                    autoCapitalize="characters"
                    spellCheck={false}
                    placeholder="WEEKEND20"
                    className="font-mono uppercase"
                  />
                )}
              />
            </div>
            <FormField
              control={control}
              name="description"
              label="Description"
              optional
              render={(field) => <Textarea {...field} rows={2} placeholder="20% off every Saturday and Sunday." />}
            />
          </FormSection>

          <FieldSeparator />

          <FormSection title="Discount">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={control}
                name="discount_type"
                label="Type"
                render={(field) => <SelectInput {...field} options={DISCOUNT_TYPE_OPTIONS} />}
              />
              {discountType === 'percentage' && (
                <FormField
                  control={control}
                  name="discount_value"
                  label="Percentage off"
                  render={(field) => (
                    <InputGroup>
                      <InputGroupInput {...field} inputMode="decimal" placeholder="20" />
                      <InputGroupAddon align="inline-end">
                        <InputGroupText>%</InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                  )}
                />
              )}
              {discountType === 'fixed_amount' && (
                <FormField
                  control={control}
                  name="discount_value"
                  label="Amount off"
                  render={(field) => (
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>₱</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput {...field} inputMode="decimal" placeholder="50" />
                    </InputGroup>
                  )}
                />
              )}
              {discountType === 'percentage' && (
                <FormField
                  control={control}
                  name="max_discount_amount"
                  label="Maximum discount"
                  optional
                  description="Caps the discount on big orders."
                  render={(field) => (
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>₱</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput {...field} inputMode="decimal" placeholder="No cap" />
                    </InputGroup>
                  )}
                />
              )}
              <FormField
                control={control}
                name="min_order_amount"
                label="Minimum order"
                optional
                render={(field) => (
                  <InputGroup>
                    <InputGroupAddon>
                      <InputGroupText>₱</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput {...field} inputMode="decimal" placeholder="No minimum" />
                  </InputGroup>
                )}
              />
            </div>
          </FormSection>

          <FieldSeparator />

          <FormSection title="Limits and eligibility">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={control}
                name="total_limit"
                label="Total uses"
                optional
                description={
                  voucher && voucher.used_count > 0 ? `Used ${voucher.used_count} times so far.` : 'Across all customers.'
                }
                render={(field) => <Input {...field} inputMode="numeric" placeholder="Unlimited" />}
              />
              <FormField
                control={control}
                name="per_user_limit"
                label="Uses per customer"
                optional
                render={(field) => <Input {...field} inputMode="numeric" placeholder="Unlimited" />}
              />
            </div>
            <FormSwitchField
              control={control}
              name="first_order_only"
              label="First order only"
              description="Only for customers placing their first order."
            />
            <FormSwitchField
              control={control}
              name="is_individual_use"
              label="Can't be combined"
              description="Customers can't use another voucher on the same order."
            />
          </FormSection>

          <FieldSeparator />

          <FormSection title="Schedule" description="Times are in your time zone.">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={control}
                name="starts_at"
                label="Starts"
                optional
                description="Leave empty to start right away."
                render={(field) => <Input {...field} type="datetime-local" />}
              />
              <FormField
                control={control}
                name="expires_at"
                label="Ends"
                optional
                description="Leave empty for no end date."
                render={(field) => <Input {...field} type="datetime-local" />}
              />
            </div>
          </FormSection>

          <FieldSeparator />

          <FormSection
            title="Applies to"
            description="Limit it to certain categories or products. Leave both empty for the whole menu."
          >
            <FormField
              control={control}
              name="categories"
              label="Categories"
              optional
              render={({ value, onChange }) => (
                <PickedItemsInput
                  value={value}
                  onChange={onChange}
                  itemLabel="category"
                  emptyText="Every category."
                  disabled={isSaving}
                  renderPicker={(add) => (
                    <ProductCategoryCombobox
                      storeId={String(storeId)}
                      value=""
                      onChange={(_value, option) => option && add(option)}
                      placeholder="Add a category"
                      aria-label="Add a category"
                    />
                  )}
                />
              )}
            />
            <FormField
              control={control}
              name="products"
              label="Products"
              optional
              render={({ value, onChange }) => (
                <PickedItemsInput
                  value={value}
                  onChange={onChange}
                  itemLabel="product"
                  emptyText="Every product."
                  disabled={isSaving}
                  renderPicker={(add) => (
                    <ProductCombobox
                      storeId={storeId}
                      value=""
                      onChange={(_value, option) => option && add(option)}
                      placeholder="Add a product"
                      aria-label="Add a product"
                    />
                  )}
                />
              )}
            />
          </FormSection>

          <FieldSeparator />

          <FormSwitchField
            control={control}
            name="is_active"
            label="Active"
            description="Turn off to pause the voucher without deleting it."
          />
        </ModalBody>
      </fieldset>

      <ModalFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={isSaving}>
            Cancel
          </Button>
        </DialogClose>
        <LoadingButton type="submit" isLoading={isSaving} className="ml-2">
          {submitLabel}
        </LoadingButton>
      </ModalFooter>

      <VoucherSaveConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        voucher={voucher}
        pending={pendingValues}
        storeName={storeName}
        isLoading={isSaving}
        onConfirm={() => pendingValues && void save(pendingValues)}
      />
    </form>
  )
}
