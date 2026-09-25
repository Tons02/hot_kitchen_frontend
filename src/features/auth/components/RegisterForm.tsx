import { yupResolver } from '@hookform/resolvers/yup'
import { useRef, useState, type FocusEvent } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useLocation } from 'react-router'
import { toast } from 'sonner'
import { FormErrorAlert } from '@/components/common/FormErrorAlert'
import { FormField } from '@/components/common/FormField'
import { FormSection } from '@/components/common/FormSection'
import { LoadingButton } from '@/components/common/LoadingButton'
import type { MascotHandle } from '@/components/common/Mascot'
import { PasswordInput } from '@/components/common/PasswordInput'
import { SelectInput, type SelectOption } from '@/components/common/SelectInput'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldSeparator } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { GENDER_LABELS, MOBILE_PREFIX } from '@/features/users/users.constants'
import { useSingleFlight } from '@/hooks/use-single-flight'
import { todayIsoDate } from '@/lib/date'
import { applyServerErrors } from '@/lib/form'
import { ROUTES } from '@/routes/paths'
import { registerSchema, type RegisterFormValues } from '../auth.schemas'
import { REGISTER_DEFAULTS, toRegisterPayload } from '../auth.utils'
import { useRegisterMutation } from '../authApi'
import { LoginMascot, type LoginField } from './LoginMascot'

const GENDER_OPTIONS: SelectOption[] = Object.entries(GENDER_LABELS).map(([value, label]) => ({ value, label }))

/**
 * Customer sign-up (`POST /register`). The API signs the new account in, so on success the auth
 * state changes and PublicRoute sends the customer on (back where they were, else the shop's home).
 */
export function RegisterForm() {
  const location = useLocation()
  const [register] = useRegisterMutation()

  const form = useForm<RegisterFormValues>({
    resolver: yupResolver(registerSchema),
    defaultValues: REGISTER_DEFAULTS,
    // Shows a problem as soon as the customer leaves the field, not only on submit.
    mode: 'onTouched',
  })
  const { control } = form
  const { isSubmitting, errors } = form.formState

  // The mascot watches the form: it follows the username as it's typed, looks at the other fields,
  // and covers its eyes over a hidden password (each password field has its own show/hide toggle).
  const mascotRef = useRef<MascotHandle>(null)
  const [focusedField, setFocusedField] = useState<LoginField | null>(null)
  const [focusedPassword, setFocusedPassword] = useState<'password' | 'password_confirmation'>('password')
  const [visiblePasswords, setVisiblePasswords] = useState({
    password: false,
    password_confirmation: false,
  })
  const username = useWatch({ control, name: 'username' })

  const trackFocus = (event: FocusEvent<HTMLFormElement>) => {
    const target = event.target as HTMLElement
    const passwordField = target.closest<HTMLElement>('[data-mascot="password"]')?.dataset.field
    if (passwordField === 'password' || passwordField === 'password_confirmation') {
      setFocusedPassword(passwordField)
      setFocusedField('password')
    } else {
      setFocusedField(target.id === 'username' ? 'username' : 'other')
    }
  }

  const clearFocus = (event: FocusEvent<HTMLFormElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocusedField(null)
  }

  const setPasswordVisible = (field: 'password' | 'password_confirmation') => (isVisible: boolean) =>
    setVisiblePasswords((current) => ({ ...current, [field]: isVisible }))

  // Ignores a second click that lands before the button has re-rendered as disabled.
  const createAccount = useSingleFlight(async (values: RegisterFormValues) => {
    try {
      const { data: user } = await register(toRegisterPayload(values)).unwrap()
      toast.success(`Welcome, ${user.first_name}! Your account is ready.`)
    } catch (error) {
      // e.g. "The username has already been taken." lands under the username field.
      applyServerErrors(error, form.setError)
      mascotRef.current?.play('dizzy', 1400)
    }
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex w-full flex-col items-center">
        {/* Tucked behind the card's top edge, like on the sign-in page. */}
        <LoginMascot
          ref={mascotRef}
          focusedField={focusedField}
          usernameLength={username.length}
          isPasswordVisible={visiblePasswords[focusedPassword]}
          className="-mb-11"
        />
        <Card className="relative w-full rounded-2xl">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Create your account</CardTitle>
            <CardDescription>Order faster and keep track of your orders.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit(createAccount)}
              onFocus={trackFocus}
              onBlur={clearFocus}
              noValidate
              className="flex flex-col gap-6"
            >
              <FormErrorAlert title="Couldn't create your account" message={errors.root?.server?.message} />

              <FormSection title="About you">
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    control={control}
                    name="first_name"
                    label="First name"
                    render={(field) => <Input {...field} autoComplete="given-name" autoFocus />}
                  />
                  <FormField
                    control={control}
                    name="last_name"
                    label="Last name"
                    render={(field) => <Input {...field} autoComplete="family-name" />}
                  />
                  <FormField
                    control={control}
                    name="middle_name"
                    label="Middle name"
                    optional
                    render={(field) => <Input {...field} autoComplete="additional-name" />}
                  />
                  <FormField
                    control={control}
                    name="suffix"
                    label="Suffix"
                    optional
                    render={(field) => <Input {...field} placeholder="Jr., Sr., III" autoComplete="honorific-suffix" />}
                  />
                  <FormField
                    control={control}
                    name="gender"
                    label="Gender"
                    render={(field) => <SelectInput {...field} options={GENDER_OPTIONS} placeholder="Select" />}
                  />
                  <FormField
                    control={control}
                    name="date_of_birth"
                    label="Date of birth"
                    render={(field) => <Input {...field} type="date" max={todayIsoDate()} autoComplete="bday" />}
                  />
                </div>
              </FormSection>

              <FieldSeparator />

              <FormSection title="Contact">
                <FormField
                  control={control}
                  name="mobile_number"
                  label="Mobile number"
                  description="For order updates from the store."
                  render={({ onChange, ...field }) => (
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>{MOBILE_PREFIX}</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        {...field}
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        placeholder="9171234567"
                        maxLength={10}
                        onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 10))}
                      />
                    </InputGroup>
                  )}
                />
                <FormField
                  control={control}
                  name="email"
                  label="Email"
                  render={(field) => <Input {...field} type="email" autoComplete="email" />}
                />
              </FormSection>

              <FieldSeparator />

              <FormSection title="Sign-in details">
                <FormField
                  control={control}
                  name="username"
                  label="Username"
                  description="4–50 characters: letters, numbers, dots, dashes or underscores."
                  render={(field) => (
                    <Input {...field} autoComplete="username" autoCapitalize="none" spellCheck={false} />
                  )}
                />
                <div data-mascot="password" data-field="password">
                  <FormField
                    control={control}
                    name="password"
                    label="Password"
                    description="At least 8 characters, with a letter and a number."
                    render={(field) => (
                      <PasswordInput
                        {...field}
                        autoComplete="new-password"
                        onVisibilityChange={setPasswordVisible('password')}
                      />
                    )}
                  />
                </div>
                <div data-mascot="password" data-field="password_confirmation">
                  <FormField
                    control={control}
                    name="password_confirmation"
                    label="Confirm password"
                    render={(field) => (
                      <PasswordInput
                        {...field}
                        autoComplete="new-password"
                        onVisibilityChange={setPasswordVisible('password_confirmation')}
                      />
                    )}
                  />
                </div>
              </FormSection>

              <LoadingButton type="submit" size="lg" className="w-full rounded-full" isLoading={isSubmitting}>
                Create account
              </LoadingButton>
            </form>
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        {/* Carries the page the customer came from, so signing in still returns them there. */}
        <Link
          to={ROUTES.login}
          state={location.state}
          className="rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
