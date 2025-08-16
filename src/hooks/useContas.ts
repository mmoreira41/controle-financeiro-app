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
}

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

  // Buscar contas do usuário
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

      setContas(data || [])
    } catch (err) {
      setErrorMessage(`Erro inesperado: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  // Adicionar nova conta
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

  // Deletar conta
  const deleteConta = async (id: string): Promise<boolean> => {
    if (!user) {
      setErrorMessage('Usuário não autenticado')
      return false
    }

    try {
      clearError()

      const { error: deleteError } = await supabase
        .from('conta_bancaria')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (deleteError) {
        setErrorMessage(`Erro ao deletar conta: ${deleteError.message}`)
        return false
      }

      // Atualizar lista local
      setContas(prev => prev.filter(conta => conta.id !== id))
      return true
    } catch (err) {
      setErrorMessage(`Erro inesperado: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
      return false
    }
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
          // Recarregar dados quando houver mudanças
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
    refreshContas
  }
}