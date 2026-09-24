import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { useState, type ComponentProps } from 'react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'

type PasswordInputProps = Omit<ComponentProps<typeof InputGroupInput>, 'type'> & {
  /** Called when the user shows or hides the password. */
  onVisibilityChange?: (isVisible: boolean) => void
}

export function PasswordInput({ onVisibilityChange, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false)

  const toggleVisibility = () => {
    const next = !isVisible
    setIsVisible(next)
    onVisibilityChange?.(next)
  }

  return (
    <InputGroup>
      <InputGroupInput {...props} type={isVisible ? 'text' : 'password'} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          aria-pressed={isVisible}
          onClick={toggleVisibility}
        >
          {isVisible ? <EyeOffIcon /> : <EyeIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}
