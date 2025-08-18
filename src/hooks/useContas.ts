import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export interface ContaBancaria {
  id: string
  user_id: string
  nome: string
  saldo_inicial: number
  data_inicial: string
  ativo: boolean
  cor: string | null
  created_at: string
  updated_at: string
}

interface UseContasReturn {
  contas: ContaBancaria[]
  loading: boolean
  error: string | null
  addConta: (conta: Omit<ContaBancaria, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<ContaBancaria | null>
  updateConta: (id: string, updates: Partial<Omit<ContaBancaria, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<boolean>
  deleteConta: (id: string) => Promise<boolean>
  refreshContas: () => Promise<void>
  getContaById: (id: string) => ContaBancaria | undefined
  getContasAtivas: () => ContaBancaria[]
}

// UUID da categoria "Saldo Inicial" das categorias globais
const SALDO_INICIAL_CATEGORIA_ID = "f2g3h4i5-j6k7-8901-bcde-012345678901"

export const useContas = (): UseContasReturn => {
  const [contas, setContas] = useState<ContaBancaria[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const setErrorMessage = (message: string) => {
    console.error('useContas error:', message)
    setError(message)
  }

  const clearError = () => setError(null)

  // Buscar todas as contas do usuário
  const fetchContas = async () => {
    if (!user) {
      setContas([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      clearError()

      const { data, error: fetchError } = await supabase
        .from('conta_bancaria')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (fetchError) {
        setErrorMessage(`Erro ao carregar contas: ${fetchError.message}`)
        return
      }

      console.log(`✅ Carregadas ${data?.length || 0} contas bancárias`)
      setContas(data || [])
    } catch (err) {
      setErrorMessage(`Erro inesperado: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  // Criar transação de saldo inicial automaticamente
  const createSaldoInicialTransaction = async (conta: ContaBancaria): Promise<boolean> => {
    if (!user) return false

    try {
      // Se saldo inicial é 0, não criar transação
      if (conta.saldo_inicial === 0) {
        console.log('💡 Saldo inicial é 0, não criando transação de saldo inicial')
        return true
      }

      const { error: transactionError } = await supabase
        .from('transacao_banco')
        .insert([{
          user_id: user.id,
          conta_id: conta.id,
          categoria_id: SALDO_INICIAL_CATEGORIA_ID,
          data: conta.data_inicial,
          valor: conta.saldo_inicial,
          tipo: 'Transferencia' as const,
          descricao: `Saldo inicial da conta ${conta.nome}`,
          previsto: false,
          realizado: true,
          meta_saldo_inicial: true,
          meta_pagamento: false,
          recorrencia: null,
          transferencia_par_id: null,
          cartao_id: null,
          competencia_fatura: null
        }])

      if (transactionError) {
        console.error('❌ Erro ao criar transação de saldo inicial:', transactionError.message)
        return false
      }

      console.log(`✅ Transação de saldo inicial criada: R$ ${conta.saldo_inicial} para conta ${conta.nome}`)
      return true
    } catch (err) {
      console.error('💥 Erro inesperado ao criar transação de saldo inicial:', err)
      return false
    }
  }

  // Adicionar nova conta bancária
  const addConta = async (contaData: Omit<ContaBancaria, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<ContaBancaria | null> => {
    if (!user) {
      setErrorMessage('Usuário não autenticado')
      return null
    }

    try {
      clearError()

      // Verificar se já existe conta com mesmo nome
      const existingConta = contas.find(c => 
        c.nome.toLowerCase() === contaData.nome.toLowerCase()
      )

      if (existingConta) {
        setErrorMessage('Já existe uma conta com esse nome')
        return null
      }

      const { data, error: insertError } = await supabase
        .from('conta_bancaria')
        .insert([{
          ...contaData,
          user_id: user.id
        }])
        .select()
        .single()

      if (insertError) {
        setErrorMessage(`Erro ao criar conta: ${insertError.message}`)
        return null
      }

      console.log(`✅ Conta criada: ${data.nome}`)

      // Criar transação de saldo inicial automaticamente
      const saldoInicialSuccess = await createSaldoInicialTransaction(data)
      if (!saldoInicialSuccess) {
        console.warn('⚠️ Falha ao criar transação de saldo inicial, mas conta foi criada')
      }

      // Atualizar lista local
      setContas(prev => [...prev, data])
      return data
    } catch (err) {
      setErrorMessage(`Erro inesperado: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
      return null
    }
  }

  // Atualizar conta existente
  const updateConta = async (id: string, updates: Partial<Omit<ContaBancaria, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<boolean> => {
    if (!user) {
      setErrorMessage('Usuário não autenticado')
      return false
    }

    try {
      clearError()

      // Verificar se mudança de nome conflita com outra conta
      if (updates.nome) {
        const existingConta = contas.find(c => 
          c.id !== id && c.nome.toLowerCase() === updates.nome!.toLowerCase()
        )

        if (existingConta) {
          setErrorMessage('Já existe uma conta com esse nome')
          return false
        }
      }

      const { data, error: updateError } = await supabase
        .from('conta_bancaria')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) {
        setErrorMessage(`Erro ao atualizar conta: ${updateError.message}`)
        return false
      }

      console.log(`✅ Conta atualizada: ${data.nome}`)

      // Atualizar lista local
      setContas(prev => prev.map(conta => 
        conta.id === id ? { ...conta, ...data } : conta
      ))

      return true
    } catch (err) {
      setErrorMessage(`Erro inesperado: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
      return false
    }
  }

  // Deletar conta (verificar se tem transações)
  const deleteConta = async (id: string): Promise<boolean> => {
    if (!user) {
      setErrorMessage('Usuário não autenticado')
      return false
    }

    try {
      clearError()

      // Verificar se a conta tem transações associadas
      const { data: transacoes, error: checkError } = await supabase
        .from('transacao_banco')
        .select('id')
        .eq('conta_id', id)
        .eq('user_id', user.id)
        .limit(1)

      if (checkError) {
        setErrorMessage(`Erro ao verificar transações: ${checkError.message}`)
        return false
      }

      if (transacoes && transacoes.length > 0) {
        setErrorMessage('Não é possível deletar conta que possui transações')
        return false
      }

      const { error: deleteError } = await supabase
        .from('conta_bancaria')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (deleteError) {
        setErrorMessage(`Erro ao deletar conta: ${deleteError.message}`)
        return false
      }

      console.log('✅ Conta deletada com sucesso')

      // Atualizar lista local
      setContas(prev => prev.filter(conta => conta.id !== id))
      return true
    } catch (err) {
      setErrorMessage(`Erro inesperado: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
      return false
    }
  }

  // Buscar conta por ID
  const getContaById = (id: string): ContaBancaria | undefined => {
    return contas.find(conta => conta.id === id)
  }

  // Filtrar apenas contas ativas
  const getContasAtivas = (): ContaBancaria[] => {
    return contas.filter(conta => conta.ativo)
  }

  // Refresh manual
  const refreshContas = async () => {
    await fetchContas()
  }

  // Carregar contas quando usuário mudar
  useEffect(() => {
    fetchContas()
  }, [user])

  // Escutar mudanças em tempo real
  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel('contas-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conta_bancaria',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Conta change detected:', payload)
          fetchContas()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  return {
    contas,
    loading,
    error,
    addConta,
    updateConta,
    deleteConta,
    refreshContas,
    getContaById,
    getContasAtivas
  }
}