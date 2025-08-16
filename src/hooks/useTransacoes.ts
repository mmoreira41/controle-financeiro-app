import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { TipoCategoria } from './useCategorias'

export interface TransacaoBanco {
  id: string
  user_id: string
  conta_id: string
  data: string
  valor: number
  categoria_id: string
  tipo: TipoCategoria
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

interface UseTransacoesReturn {
  transacoes: TransacaoBanco[]
  loading: boolean
  error: string | null
  addTransacao: (transacao: Omit<TransacaoBanco, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<TransacaoBanco | null>
  updateTransacao: (id: string, updates: Partial<Omit<TransacaoBanco, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<boolean>
  deleteTransacao: (id: string) => Promise<boolean>
  getTransacoesbyConta: (contaId: string) => TransacaoBanco[]
  getTransacoesbyPeriodo: (dataInicio: string, dataFim: string) => TransacaoBanco[]
  calcularSaldoConta: (contaId: string, dataLimite?: string) => number
  refreshTransacoes: () => Promise<void>
}

export const useTransacoes = (): UseTransacoesReturn => {
  const [transacoes, setTransacoes] = useState<TransacaoBanco[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const setErrorMessage = (message: string) => {
    console.error('useTransacoes error:', message)
    setError(message)
  }

  const clearError = () => setError(null)

  // Buscar transações do usuário
  const fetchTransacoes = async () => {
    if (!user) {
      setTransacoes([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      clearError()

      const { data, error: fetchError } = await supabase
        .from('transacao_banco')
        .select('*')
        .eq('user_id', user.id)
        .order('data', { ascending: false })
        .order('created_at', { ascending: false })

      if (fetchError) {
        setErrorMessage(`Erro ao carregar transações: ${fetchError.message}`)
        return
      }

      setTransacoes(data || [])
    } catch (err) {
      setErrorMessage(`Erro inesperado: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  // Adicionar nova transação
  const addTransacao = async (transacaoData: Omit<TransacaoBanco, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<TransacaoBanco | null> => {
    if (!user) {
      setErrorMessage('Usuário não autenticado')
      return null
    }

    try {
      clearError()

      const { data, error: insertError } = await supabase
        .from('transacao_banco')
        .insert([{
          ...transacaoData,
          user_id: user.id
        }])
        .select()
        .single()

      if (insertError) {
        setErrorMessage(`Erro ao criar transação: ${insertError.message}`)
        return null
      }

      // Atualizar lista local
      setTransacoes(prev => [data, ...prev])
      return data
    } catch (err) {
      setErrorMessage(`Erro inesperado: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
      return null
    }
  }

  // Atualizar transação existente
  const updateTransacao = async (id: string, updates: Partial<Omit<TransacaoBanco, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<boolean> => {
    if (!user) {
      setErrorMessage('Usuário não autenticado')
      return false
    }

    try {
      clearError()

      const { data, error: updateError } = await supabase
        .from('transacao_banco')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) {
        setErrorMessage(`Erro ao atualizar transação: ${updateError.message}`)
        return false
      }

      // Atualizar lista local
      setTransacoes(prev => prev.map(trans => 
        trans.id === id ? { ...trans, ...data } : trans
      ))

      return true
    } catch (err) {
      setErrorMessage(`Erro inesperado: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
      return false
    }
  }

  // Deletar transação
  const deleteTransacao = async (id: string): Promise<boolean> => {
    if (!user) {
      setErrorMessage('Usuário não autenticado')
      return false
    }

    try {
      clearError()

      const { error: deleteError } = await supabase
        .from('transacao_banco')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (deleteError) {
        setErrorMessage(`Erro ao deletar transação: ${deleteError.message}`)
        return false
      }

      // Atualizar lista local
      setTransacoes(prev => prev.filter(trans => trans.id !== id))
      return true
    } catch (err) {
      setErrorMessage(`Erro inesperado: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
      return false
    }
  }

  // Filtrar transações por conta
  const getTransacoesbyConta = (contaId: string): TransacaoBanco[] => {
    return transacoes.filter(trans => trans.conta_id === contaId)
  }

  // Filtrar transações por período
  const getTransacoesbyPeriodo = (dataInicio: string, dataFim: string): TransacaoBanco[] => {
    return transacoes.filter(trans => 
      trans.data >= dataInicio && trans.data <= dataFim
    )
  }

  // Calcular saldo da conta baseado nas transações
  const calcularSaldoConta = (contaId: string, dataLimite?: string): number => {
    const transacoesConta = transacoes
      .filter(trans => trans.conta_id === contaId)
      .filter(trans => !dataLimite || trans.data <= dataLimite)
      .filter(trans => trans.realizado) // Apenas transações realizadas

    let saldo = 0

    for (const trans of transacoesConta) {
      switch (trans.tipo) {
        case 'Entrada':
          saldo += trans.valor
          break
        case 'Saida':
          saldo -= trans.valor
          break
        case 'Transferencia':
          // Se é saldo inicial, adiciona
          if (trans.meta_saldo_inicial) {
            saldo += trans.valor
          } else {
            // Para transferências normais, se é a conta de origem, subtrai
            // Se é a conta de destino, adiciona
            // O RLS e triggers do banco cuidam da lógica correta
            const isOrigem = !trans.transferencia_par_id || 
                           transacoes.some(t => t.id === trans.transferencia_par_id && t.conta_id !== contaId)
            
            if (isOrigem) {
              saldo -= trans.valor
            } else {
              saldo += trans.valor
            }
          }
          break
        case 'Investimento':
          saldo -= trans.valor // Investimento é saída de dinheiro
          break
        case 'Estorno':
          saldo += trans.valor // Estorno é entrada de dinheiro
          break
      }
    }

    return saldo
  }

  // Refresh manual
  const refreshTransacoes = async () => {
    await fetchTransacoes()
  }

  // Carregar transações quando usuário mudar
  useEffect(() => {
    fetchTransacoes()
  }, [user])

  // Escutar mudanças em tempo real
  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel('transacoes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transacao_banco',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Transacao change detected:', payload)
          fetchTransacoes()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  return {
    transacoes,
    loading,
    error,
    addTransacao,
    updateTransacao,
    deleteTransacao,
    getTransacoesbyConta,
    getTransacoesbyPeriodo,
    calcularSaldoConta,
    refreshTransacoes
  }
}