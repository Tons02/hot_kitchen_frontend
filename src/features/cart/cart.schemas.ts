import { array, number, object, string, type InferType } from 'yup'

/** The most of one line the API accepts (CartItem::MAX_QUANTITY). */
export const MAX_LINE_QUANTITY = 99

/**
 * Mirrors CartItemRequest for the options dialog. Context: `requiresVariation` is true when the
 * product has available variations, so one must be chosen (the API refuses otherwise).
 */
export const cartItemOptionsSchema = object({
  variation_id: string()
    .default('')
    .when('$requiresVariation', {
      is: true,
      then: (schema) => schema.required('Choose one.'),
    }),
  add_on_ids: array(string().required()).default([]),
  quantity: number()
    .required()
    .integer()
    .min(1, 'Order at least 1.')
    .max(MAX_LINE_QUANTITY, `You can order up to ${MAX_LINE_QUANTITY} at a time.`),
  notes: string().trim().max(255, 'Keep it under 255 characters.').default(''),
})

export type CartItemOptionsValues = InferType<typeof cartItemOptionsSchema>
