import { SearchIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  /** The search that's currently applied. Typing edits a draft until Enter is pressed. */
  value: string
  /** Called on Enter, and with '' when the search is cleared. */
  onSearch: (value: string) => void
  placeholder?: string
  /** Accessible name; defaults to the placeholder. */
  label?: string
  className?: string
}

/** A search box that searches on Enter, so every keystroke doesn't hit the API. */
export function SearchInput({ value, onSearch, placeholder = 'Search', label, className }: SearchInputProps) {
  const [draft, setDraft] = useState(value)
  const [appliedValue, setAppliedValue] = useState(value)

  // Follow the applied search when it changes from outside (e.g. switching tabs resets it).
  if (value !== appliedValue) {
    setAppliedValue(value)
    setDraft(value)
  }

  const clear = () => {
    setDraft('')
    onSearch('')
  }

  return (
    <form
      role="search"
      className={cn('w-full', className)}
      onSubmit={(event) => {
        event.preventDefault()
        onSearch(draft.trim())
      }}
    >
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          value={draft}
          placeholder={placeholder}
          aria-label={label ?? placeholder}
          enterKeyHint="search"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && draft) {
              event.preventDefault()
              clear()
            }
          }}
        />
        {draft && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={clear}>
              <XIcon />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
    </form>
  )
}
