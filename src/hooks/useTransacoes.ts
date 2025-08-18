import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export type TipoTransacao = 'Entrada' | 'Saida' | 'Investimento' | 'Transferencia' | 'Estorno'

export interface TransacaoBanco {
  id: string
  user_id: string
  conta_id: string
  categoria_id: string
  data: string
  valor: number
  tipo: TipoTransacao
  descricao: string
  previsto: boolean
  realizado: boolean
  meta_saldo_inicial: boolean
  meta_pagamento: boolean
  recorrencia: any | null
  transferencia_par_id: string | null
  cartao_id: string | null
  competencia_fatura: string | null
  created_at: string
  updated_at: string
}

export interface TransacaoComDados extends TransacaoBanco {
  conta_nome?: string
  categoria_nome?: string
  categoria_tipo?: string
}

interface UseTransacoesReturn {
  transacoes: TransacaoComDados[]
  loading: boolean
  error: string | null
  addTransacao: (transacao: Omit<TransacaoBanco, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<TransacaoBanco | null>
  updateTransacao: (id: string, updates: Partial<Omit<TransacaoBanco, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<boolean>
  deleteTransacao: (id: string) => Promise<boolean>
  refreshTransacoes: () => Promise<void>
  getTransacoesByConta: (contaId: string) => TransacaoComDados[]
  getTransacoesByCategoria: (categoriaId: string) => TransacaoComDados[]
  getTransacoesByTipo: (tipo: TipoTransacao) => TransacaoComDados[]
  getTransacoesByPeriodo: (dataInicio: string, dataFim: string) => TransacaoComDados[]
  getSaldoByPeriodo: (contaId: string, dataInicio: string, dataFim: string) => number
  createTransferencia: (contaOrigemId: string, contaDestinoId: string, valor: number, data: string, descricao: string) => Promise<boolean>
  toggleRealizado: (id: string) => Promise<boolean>
}

// UUID da categoria "Transferência" das categorias globais
const TRANSFERENCIA_CATEGORIA_ID = "e1f2g3h4-i5j6-7890-abcd-901234567890"

export const useTransacoes = (): UseTransacoesReturn => {
  const [transacoes, setTransacoes] = useState<TransacaoComDados[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const setErrorMessage = (message: string) => {
    console.error('useTransacoes error:', message)
    setError(message)
  }

  const clearError = () => setError(null)

  // Buscar todas as transações do usuário com dados relacionados
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
        .select(`
          *,
          conta_bancaria!inner(
            nome
          ),
          categoria!inner(
            nome,
            tipo
          )
        `)
        .eq('user_id', user.id)
        .order('data', { ascending: false })
        .order('created_at', { ascending: false })

      if (fetchError) {
        setErrorMessage(`Erro ao carregar transações: ${fetchError.message}`)
        return
      }

      // Transformar dados para incluir nomes das tabelas relacionadas
      const transacoesComDados: TransacaoComDados[] = (data || []).map(t => ({
        ...t,
        conta_nome: t.conta_bancaria?.nome,
        categoria_nome: t.categoria?.nome,
        categoria_tipo: t.categoria?.tipo
      }))

      console.log(`✅ Carregadas ${transacoesComDados.length} transações`)
      setTransacoes(transacoesComDados)
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

      console.log(`✅ Transação criada: ${data.descricao} - R$ ${data.valor}`)

      // Refresh para pegar dados relacionados
      await fetchTransacoes()
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

      const { error: updateError } = await supabase
        .from('transacao_banco')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)

      if (updateError) {
        setErrorMessage(`Erro ao atualizar transação: ${updateError.message}`)
        return false
      }

      console.log(`✅ Transação atualizada: ${id}`)

      // Refresh para pegar dados atualizados
      await fetchTransacoes()
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

      // Verificar se é uma transferência (tem par)
      const transacao = transacoes.find(t => t.id === id)
      if (transacao?.transferencia_par_id) {
        // Deletar também a transação par da transferência
        const { error: deleteParError } = await supabase
          .from('transacao_banco')
          .delete()
          .eq('id', transacao.transferencia_par_id)
          .eq('user_id', user.id)

        if (deleteParError) {
          console.warn('⚠️ Erro ao deletar transação par da transferência:', deleteParError.message)
        }
      }

      const { error: deleteError } = await supabase
        .from('transacao_banco')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (deleteError) {
        setErrorMessage(`Erro ao deletar transação: ${deleteError.message}`)
        return false
      }

      console.log('✅ Transação deletada com sucesso')

      // Atualizar lista local
      setTransacoes(prev => prev.filter(t => t.id !== id))
      return true
    } catch (err) {
      setErrorMessage(`Erro inesperado: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
      return false
    }
  }

  // Criar transferência entre contas (cria 2 transações)
  const createTransferencia = async (
    contaOrigemId: string, 
    contaDestinoId: string, 
    valor: number, 
    data: string, 
    descricao: string
  ): Promise<boolean> => {
    if (!user) {
      setErrorMessage('Usuário não autenticado')
      return false
    }

    try {
      clearError()

      // Criar transação de saída na conta origem
      const { data: transacaoSaida, error: saidaError } = await supabase
        .from('transacao_banco')
        .insert([{
          user_id: user.id,
          conta_id: contaOrigemId,
          categoria_id: TRANSFERENCIA_CATEGORIA_ID,
          data,
          valor: -Math.abs(valor), // Valor negativo para saída
          tipo: 'Transferencia' as const,
          descricao: `${descricao} (Transferência OUT)`,
          previsto: false,
          realizado: true,
          meta_saldo_inicial: false,
          meta_pagamento: false,
          recorrencia: null,
          cartao_id: null,
          competencia_fatura: null
        }])
        .select()
        .single()

      if (saidaError) {
        setErrorMessage(`Erro ao criar transação de saída: ${saidaError.message}`)
        return false
      }

      // Criar transação de entrada na conta destino
      const { data: transacaoEntrada, error: entradaError } = await supabase
        .from('transacao_banco')
        .insert([{
          user_id: user.id,
          conta_id: contaDestinoId,
          categoria_id: TRANSFERENCIA_CATEGORIA_ID,
          data,
          valor: Math.abs(valor), // Valor positivo para entrada
          tipo: 'Transferencia' as const,
          descricao: `${descricao} (Transferência IN)`,
          previsto: false,
          realizado: true,
          meta_saldo_inicial: false,
          meta_pagamento: false,
          recorrencia: null,
          transferencia_par_id: transacaoSaida.id, // Referenciar a transação de saída
          cartao_id: null,
          competencia_fatura: null
        }])
        .select()
        .single()

      if (entradaError) {
        setErrorMessage(`Erro ao criar transação de entrada: ${entradaError.message}`)
        return false
      }

      // Atualizar a transação de saída para referenciar a de entrada
      await supabase
        .from('transacao_banco')
        .update({ transferencia_par_id: transacaoEntrada.id })
        .eq('id', transacaoSaida.id)

      console.log(`✅ Transferência criada: R$ ${valor} de ${contaOrigemId} para ${contaDestinoId}`)

      // Refresh para pegar dados atualizados
      await fetchTransacoes()
      return true
    } catch (err) {
      setErrorMessage(`Erro inesperado: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
      return false
    }
  }

  // Toggle realizado/previsto
  const toggleRealizado = async (id: string): Promise<boolean> => {
    const transacao = transacoes.find(t => t.id === id)
    if (!transacao) return false

    return await updateTransacao(id, { realizado: !transacao.realizado })
  }

  // Filtros e consultas
  const getTransacoesByConta = (contaId: string): TransacaoComDados[] => {
    return transacoes.filter(t => t.conta_id === contaId)
  }

  const getTransacoesByCategoria = (categoriaId: string): TransacaoComDados[] => {
    return transacoes.filter(t => t.categoria_id === categoriaId)
  }

  const getTransacoesByTipo = (tipo: TipoTransacao): TransacaoComDados[] => {
    return transacoes.filter(t => t.tipo === tipo)
  }

  const getTransacoesByPeriodo = (dataInicio: string, dataFim: string): TransacaoComDados[] => {
    return transacoes.filter(t => 
      t.data >= dataInicio && t.data <= dataFim
    )
  }

  // Calcular saldo de uma conta em um período
  const getSaldoByPeriodo = (contaId: string, dataInicio: string, dataFim: string): number => {
    const transacoesPeriodo = transacoes.filter(t => 
      t.conta_id === contaId && 
      t.data >= dataInicio && 
      t.data <= dataFim &&
      t.realizado
    )

    return transacoesPeriodo.reduce((saldo, t) => saldo + t.valor, 0)
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
          console.log('Transação change detected:', payload)
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
    refreshTransacoes,
    getTransacoesByConta,
    getTransacoesByCategoria,
    getTransacoesByTipo,
    getTransacoesByPeriodo,
    getSaldoByPeriodo,
    createTransferencia,
    toggleRealizado
  }
}