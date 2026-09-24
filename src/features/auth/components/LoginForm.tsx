import { yupResolver } from '@hookform/resolvers/yup'
import { useRef, useState, type FocusEvent, type SubmitEvent } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { FormErrorAlert } from '@/components/common/FormErrorAlert'
import { FormField } from '@/components/common/FormField'
import { LoadingButton } from '@/components/common/LoadingButton'
import type { MascotHandle } from '@/components/common/Mascot'
import { PasswordInput } from '@/components/common/PasswordInput'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { applyServerErrors } from '@/lib/form'
import { loginSchema, type LoginFormValues } from '../auth.schemas'
import { useLoginMutation } from '../authApi'
import { LoginMascot, type LoginField } from './LoginMascot'

export function LoginForm() {
  const [login] = useLoginMutation()
  const mascotRef = useRef<MascotHandle>(null)
  const [focusedField, setFocusedField] = useState<LoginField | null>(null)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: yupResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  const username = useWatch({ control: form.control, name: 'username' })
  const { isSubmitting, errors } = form.formState

  // On success the auth state changes and PublicRoute redirects, so there's nothing to navigate here.
  const signIn = async (values: LoginFormValues) => {
    try {
      const { data: user } = await login(values).unwrap()
      toast.success(`Welcome back, ${user.first_name}!`)
    } catch (error) {
      applyServerErrors(error, form.setError)
      mascotRef.current?.play('dizzy', 1400)
    }
  }

  const onSubmit = (event: SubmitEvent<HTMLFormElement>) => form.handleSubmit(signIn)(event)

  // Tracks focus on a field's wrapper, so moving from the password input to its
  // show/hide button still counts as being in the password field.
  const trackFocus = (field: LoginField) => ({
    onFocus: () => setFocusedField(field),
    onBlur: (event: FocusEvent<HTMLDivElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setFocusedField(null)
    },
  })

  return (
    <div className="flex flex-col items-center">
      {/* Tucked behind the card's top edge so the toaster peeks over it. */}
      <LoginMascot
        ref={mascotRef}
        focusedField={focusedField}
        usernameLength={username.length}
        isPasswordVisible={isPasswordVisible}
        className="-mb-11"
      />
      <Card className="relative w-full">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Sign in</CardTitle>
          <CardDescription>Enter your username and password to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} noValidate>
            <FieldGroup>
              <FormErrorAlert title="Unable to sign in" message={errors.root?.server?.message} />
              <div {...trackFocus('username')}>
                <FormField
                  control={form.control}
                  name="username"
                  label="Username"
                  render={(field) => <Input {...field} autoComplete="username" autoFocus />}
                />
              </div>
              <div {...trackFocus('password')}>
                <FormField
                  control={form.control}
                  name="password"
                  label="Password"
                  render={(field) => (
                    <PasswordInput
                      {...field}
                      autoComplete="current-password"
                      onVisibilityChange={setIsPasswordVisible}
                    />
                  )}
                />
              </div>
              <LoadingButton type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
                Sign in
              </LoadingButton>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
