import { CircleAlertIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface FormErrorAlertProps {
  /** Usually `form.formState.errors.root?.server?.message`, set by `applyServerErrors()`. */
  message?: string
  title?: string
}

/** Form-level error that isn't tied to a single field. Renders nothing without a message. */
export function FormErrorAlert({ message, title = 'Something went wrong' }: FormErrorAlertProps) {
  if (!message) return null

  return (
    <Alert variant="destructive">
      <CircleAlertIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
