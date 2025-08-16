import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('=== SUPABASE CONFIG DEBUG ===')
console.log('URL:', supabaseUrl)
console.log('Key exists:', !!supabaseKey)
console.log('Key preview:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'MISSING')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE CONFIG ERROR')
  console.error('URL:', supabaseUrl)
  console.error('Key:', supabaseKey)
  throw new Error('Missing Supabase environment variables')
}

console.log('✅ Supabase client configured successfully')

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Types for our database schema
export type Database = {
  public: {
    Tables: {
      conta_bancaria: {
        Row: {
          id: string
          user_id: string
          nome: string
          saldo_inicial: number
          data_inicial: string
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nome: string
          saldo_inicial?: number
          data_inicial?: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nome?: string
          saldo_inicial?: number
          data_inicial?: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categoria: {
        Row: {
          id: string
          user_id: string
          nome: string
          tipo: 'Entrada' | 'Saida' | 'Investimento' | 'Transferencia' | 'Estorno'
          sistema: boolean
          orcamento_mensal: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nome: string
          tipo: 'Entrada' | 'Saida' | 'Investimento' | 'Transferencia' | 'Estorno'
          sistema?: boolean
          orcamento_mensal?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nome?: string
          tipo?: 'Entrada' | 'Saida' | 'Investimento' | 'Transferencia' | 'Estorno'
          sistema?: boolean
          orcamento_mensal?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      cartao: {
        Row: {
          id: string
          user_id: string
          apelido: string
          dia_fechamento: number
          dia_vencimento: number
          limite: number | null
          bandeira: string
          cor: string
          conta_id_padrao: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          apelido: string
          dia_fechamento: number
          dia_vencimento: number
          limite?: number | null
          bandeira?: string
          cor?: string
          conta_id_padrao?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          apelido?: string
          dia_fechamento?: number
          dia_vencimento?: number
          limite?: number | null
          bandeira?: string
          cor?: string
          conta_id_padrao?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transacao_banco: {
        Row: {
          id: string
          user_id: string
          conta_id: string
          data: string
          valor: number
          categoria_id: string
          tipo: 'Entrada' | 'Saida' | 'Investimento' | 'Transferencia' | 'Estorno'
          descricao: string | null
          transferencia_par_id: string | null
          previsto: boolean
          realizado: boolean
          recorrencia: string | null
          meta_saldo_inicial: boolean
          meta_pagamento: boolean
          cartao_id: string | null
          competencia_fatura: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          conta_id: string
          data: string
          valor: number
          categoria_id: string
          tipo: 'Entrada' | 'Saida' | 'Investimento' | 'Transferencia' | 'Estorno'
          descricao?: string | null
          transferencia_par_id?: string | null
          previsto?: boolean
          realizado?: boolean
          recorrencia?: string | null
          meta_saldo_inicial?: boolean
          meta_pagamento?: boolean
          cartao_id?: string | null
          competencia_fatura?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          conta_id?: string
          data?: string
          valor?: number
          categoria_id?: string
          tipo?: 'Entrada' | 'Saida' | 'Investimento' | 'Transferencia' | 'Estorno'
          descricao?: string | null
          transferencia_par_id?: string | null
          previsto?: boolean
          realizado?: boolean
          recorrencia?: string | null
          meta_saldo_inicial?: boolean
          meta_pagamento?: boolean
          cartao_id?: string | null
          competencia_fatura?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      compra_cartao: {
        Row: {
          id: string
          user_id: string
          cartao_id: string
          data_compra: string
          valor_total: number
          parcelas_total: number
          categoria_id: string
          descricao: string | null
          estorno: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          cartao_id: string
          data_compra: string
          valor_total: number
          parcelas_total: number
          categoria_id: string
          descricao?: string | null
          estorno?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          cartao_id?: string
          data_compra?: string
          valor_total?: number
          parcelas_total?: number
          categoria_id?: string
          descricao?: string | null
          estorno?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      parcela_cartao: {
        Row: {
          id: string
          user_id: string
          compra_id: string
          n_parcela: number
          valor_parcela: number
          competencia_fatura: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          compra_id: string
          n_parcela: number
          valor_parcela: number
          competencia_fatura: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          compra_id?: string
          n_parcela?: number
          valor_parcela?: number
          competencia_fatura?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}