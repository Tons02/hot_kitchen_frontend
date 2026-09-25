import type { Ref } from 'react'
import toasterDirections from '@/assets/mascots/toaster-directions.webp'
import toasterReactions from '@/assets/mascots/toaster-reactions.webp'
import {
  Mascot,
  type MascotDirection,
  type MascotExpression,
  type MascotHandle,
} from '@/components/common/Mascot'

/**
 * Which kind of field has focus: the username (the mascot follows its text), a password (it covers
 * its eyes), or any other field (it looks down at the form).
 */
export type LoginField = 'username' | 'password' | 'other'

interface LoginMascotProps {
  focusedField: LoginField | null
  usernameLength: number
  isPasswordVisible: boolean
  className?: string
  ref?: Ref<MascotHandle>
}

/*
 * The mascot sits centred above the card and the username text starts at the input's left edge.
 * These are roughly the character counts at which the caret crosses into the mascot's
 * "down" sector and then past it, for the card's width at 14px Inter.
 */
const CARET_REACHES_CENTER = 14
const CARET_PASSES_CENTER = 26

function gazeAtUsername(length: number): MascotDirection {
  if (length < CARET_REACHES_CENTER) return 'down-left'
  if (length < CARET_PASSES_CENTER) return 'down'
  return 'down-right'
}

/**
 * A toaster that watches the sign-in and sign-up forms:
 * - follows the pointer while nothing is focused
 * - follows the text as the username is typed, and looks at the form for other fields
 * - closes its eyes over a hidden password, and peeks when the password is shown
 */
export function LoginMascot({ focusedField, usernameLength, isPasswordVisible, className, ref }: LoginMascotProps) {
  let gaze: MascotDirection | null = null
  let expression: MascotExpression | null = null

  if (focusedField === 'username') {
    gaze = gazeAtUsername(usernameLength)
  } else if (focusedField === 'other') {
    gaze = 'down'
  } else if (focusedField === 'password') {
    if (isPasswordVisible) gaze = 'down'
    else expression = 'bashful'
  }

  return (
    <Mascot
      ref={ref}
      directions={toasterDirections}
      reactions={toasterReactions}
      size={128}
      gaze={gaze}
      expression={expression}
      className={className}
    />
  )
}
