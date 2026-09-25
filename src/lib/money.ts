const PESO = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })

/** "100.00" or 100 → "₱100.00". Decimal columns arrive as strings. */
export function formatPeso(amount: string | number): string {
  const value = typeof amount === 'number' ? amount : Number(amount)
  return Number.isFinite(value) ? PESO.format(value) : String(amount)
}
