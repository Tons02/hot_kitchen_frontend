import { object, string, type InferType } from 'yup'

export const loginSchema = object({
  username: string().trim().required('Enter your username.'),
  password: string().required('Enter your password.'),
})

export type LoginFormValues = InferType<typeof loginSchema>
