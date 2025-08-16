import { createClient } from '@supabase/supabase-js'

// Usar process.env em vez de import.meta.env para compatibilidade
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos serão gerados automaticamente pelo Supabase CLI ou Claude Code
export type Database = any // Placeholder temporário
