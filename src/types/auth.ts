import { User, Session } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, nomeCompleto?: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  resendConfirmation: (email: string) => Promise<void>
  clearError: () => void
}

export interface LoginFormData {
  email: string
  password: string
}

export interface SignUpFormData extends LoginFormData {
  nomeCompleto: string
  confirmPassword: string
}

export interface ResetPasswordFormData {
  email: string
}

export type AuthMode = 'login' | 'signup' | 'reset'