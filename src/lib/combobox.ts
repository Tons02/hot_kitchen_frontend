/** How many matches a picker asks the API for at a time. Typing narrows the list. */
export const COMBOBOX_PAGE_SIZE = 20

/** "Showing 20 of 134. Type to narrow the list." when the page doesn't hold every match. */
export function getComboboxFooter(shown: number, total: number): string | undefined {
  return total > shown ? `Showing ${shown} of ${total.toLocaleString()}. Type to narrow the list.` : undefined
}
