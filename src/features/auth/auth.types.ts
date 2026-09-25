import type { Gender, User } from '@/features/users/users.types'

/** The user returned by `POST /login`. */
export interface AuthUser extends User {
  should_change_password: boolean
}

export interface AuthSession {
  token: string
  user: AuthUser
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  message: string
  token: string
  data: AuthUser
}

/** `POST /register` (RegisterRequest). Creates a customer account and signs it in. */
export interface RegisterRequest {
  first_name: string
  middle_name: string | null
  last_name: string
  suffix: string | null
  gender: Gender
  /** YYYY-MM-DD. */
  date_of_birth: string
  /** Full international format, e.g. +639171234567. */
  mobile_number: string
  username: string
  email: string
  password: string
  password_confirmation: string
}

/** Same shape as the login response: the new customer is signed in right away. */
export type RegisterResponse = LoginResponse
