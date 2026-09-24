import type { User } from '@/features/users/users.types'

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
