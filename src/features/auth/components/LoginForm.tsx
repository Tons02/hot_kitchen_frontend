import { yupResolver } from '@hookform/resolvers/yup'
import { useRef, useState, type FocusEvent, type SubmitEvent } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useLocation } from 'react-router'
import { toast } from 'sonner'
import { FormErrorAlert } from '@/components/common/FormErrorAlert'
import { FormField } from '@/components/common/FormField'
import { LoadingButton } from '@/components/common/LoadingButton'
import type { MascotHandle } from '@/components/common/Mascot'
import { PasswordInput } from '@/components/common/PasswordInput'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useSingleFlight } from '@/hooks/use-single-flight'
import { applyServerErrors } from '@/lib/form'
import { ROUTES } from '@/routes/paths'
import { normalizeApiError } from '@/services/api/apiError'
import { loginSchema, type LoginFormValues } from '../auth.schemas'
import { useLoginMutation } from '../authApi'
import { ForgotPasswordDialog } from './ForgotPasswordDialog'
import { LoginMascot, type LoginField } from './LoginMascot'

const LINK_CLASS =
  'rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none'

/**
 * The one sign-in for customers and staff (`POST /login` with a username). On success the auth state
 * changes and PublicRoute sends the user on (back where they were, else the shop or the dashboard by
 * role), so there's nothing to navigate here.
 */
export function LoginForm() {
  const location = useLocation()
  const [login] = useLoginMutation()
  const mascotRef = useRef<MascotHandle>(null)
  const [focusedField, setFocusedField] = useState<LoginField | null>(null)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: yupResolver(loginSchema),
    defaultValues: { username: '', password: '' },
    // Shows a missing field as soon as the user leaves it, not only on submit.
    mode: 'onTouched',
  })

  const username = useWatch({ control: form.control, name: 'username' })
  const { isSubmitting, errors } = form.formState

  // Ignores a second click that lands before the button has re-rendered as disabled.
  const signIn = useSingleFlight(async (values: LoginFormValues) => {
    try {
      const { data: user } = await login(values).unwrap()
      toast.success(`Welcome back, ${user.first_name}!`)
    } catch (error) {
      // The API answers wrong credentials with 400 "Invalid Credentials"; say it in plain words.
      if (normalizeApiError(error).status === 400) {
        form.setError('root.server', { type: 'server', message: 'Please check your username and password.' })
      } else {
        applyServerErrors(error, form.setError)
      }
      mascotRef.current?.play('dizzy', 1400)
    }
  })

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
    <div className="flex flex-col items-center gap-6">
      <div className="flex w-full flex-col items-center">
        {/* Tucked behind the card's top edge so the toaster peeks over it. */}
        <LoginMascot
          ref={mascotRef}
          focusedField={focusedField}
          usernameLength={username.length}
          isPasswordVisible={isPasswordVisible}
          className="-mb-11"
        />
        <Card className="relative w-full rounded-2xl">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Welcome back!</CardTitle>
            <CardDescription>Sign in to order, or to manage your stores.</CardDescription>
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
                    render={(field) => (
                      <Input {...field} autoComplete="username" autoCapitalize="none" spellCheck={false} autoFocus />
                    )}
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
                <LoadingButton type="submit" size="lg" className="w-full rounded-full" isLoading={isSubmitting}>
                  Sign in
                </LoadingButton>
                <div className="flex items-center justify-between gap-4">
                  {/* Carries the page the user came from, so signing up still returns them there. */}
                  <Link to={ROUTES.register} state={location.state} className={LINK_CLASS}>
                    Create account
                  </Link>
                  <ForgotPasswordDialog />
                </div>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="flex w-full items-center gap-3 text-xs text-muted-foreground uppercase">
        <Separator className="flex-1" />
        or
        <Separator className="flex-1" />
      </div>

      <Button asChild variant="outline" size="lg" className="w-full rounded-full">
        <Link to={ROUTES.home}>Continue as guest</Link>
      </Button>
    </div>
  )
}
