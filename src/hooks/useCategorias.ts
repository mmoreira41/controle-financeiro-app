import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export type TipoCategoria = 'Entrada' | 'Saida' | 'Investimento' | 'Transferencia' | 'Estorno'

export interface Categoria {
  id: string
  user_id: string
  nome: string
  tipo: TipoCategoria
  sistema: boolean
  orcamento_mensal: number | null
  created_at: string
  updated_at: string
}

interface UseCategoriasReturn {
  categorias: Categoria[]
  loading: boolean
  error: string | null
  addCategoria: (categoria: Omit<Categoria, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Categoria | null>
  updateCategoria: (id: string, updates: Partial<Omit<Categoria, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sistema'>>) => Promise<boolean>
  deleteCategoria: (id: string) => Promise<boolean>
  refreshCategorias: () => Promise<void>
  getCategoriasbyTipo: (tipo: TipoCategoria) => Categoria[]
}

export const useCategorias = (): UseCategoriasReturn => {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const setErrorMessage = (message: string) => {
    console.error('useCategorias error:', message)
    setError(message)
  }

  const clearError = () => setError(null)

  // Buscar categorias do usuário
  const fetchCategorias = async () => {
    if (!user) {
      setCategorias([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      clearError()

      const { data, error: fetchError } = await supabase
        .from('categoria')
        .select('*')
        .eq('user_id', user.id)
        .order('sistema', { ascending: false }) // Sistema primeiro
        .order('nome', { ascending: true })

      if (fetchError) {
        setErrorMessage(`Erro ao carregar categorias: ${fetchError.message}`)
        return
      }

      setCategorias(data || [])
    } catch (err) {
      setErrorMessage(`Erro inesperado: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  // Adicionar nova categoria
  const addCategoria = async (categoriaData: Omit<Categoria, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Categoria | null> => {
    if (!user) {
      setErrorMessage('Usuário não autenticado')
      return null
    }

    try {
      clearError()

      // Verificar se já existe categoria com mesmo nome
      const existingCategoria = categorias.find(c => 
        c.nome.toLowerCase() === categoriaData.nome.toLowerCase()
      )

      if (existingCategoria) {
        setErrorMessage('Já existe uma categoria com esse nome')
        return null
      }

      const { data, error: insertError } = await supabase
        .from('categoria')
        .insert([{
          ...categoriaData,
          user_id: user.id
        }])
        .select()
        .single()

      if (insertError) {
        setErrorMessage(`Erro ao criar categoria: ${insertError.message}`)
        return null
      }

      // Atualizar lista local
      setCategorias(prev => [...prev, data])
      return data
    } catch (err) {
      setErrorMessage(`Erro inesperado: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
      return null
    }
  }

  // Atualizar categoria existente (não permite alterar categorias do sistema)
  const updateCategoria = async (id: string, updates: Partial<Omit<Categoria, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sistema'>>): Promise<boolean> => {
    if (!user) {
      setErrorMessage('Usuário não autenticado')
      return false
    }

    try {
      clearError()

      // Verificar se é categoria do sistema
      const categoria = categorias.find(c => c.id === id)
      if (categoria?.sistema) {
        setErrorMessage('Não é possível editar categorias do sistema')
        return false
      }

      // Verificar se mudança de nome conflita com outra categoria
      if (updates.nome) {
        const existingCategoria = categorias.find(c => 
          c.id !== id && c.nome.toLowerCase() === updates.nome!.toLowerCase()
        )

        if (existingCategoria) {
          setErrorMessage('Já existe uma categoria com esse nome')
          return false
        }
      }

      const { data, error: updateError } = await supabase
        .from('categoria')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('sistema', false) // Apenas categorias não-sistema
        .select()
        .single()

      if (updateError) {
        setErrorMessage(`Erro ao atualizar categoria: ${updateError.message}`)
        return false
      }

      // Atualizar lista local
      setCategorias(prev => prev.map(cat => 
        cat.id === id ? { ...cat, ...data } : cat
      ))

      return true
    } catch (err) {
      setErrorMessage(`Erro inesperado: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
      return false
    }
  }

  // Deletar categoria (não permite deletar categorias do sistema)
  const deleteCategoria = async (id: string): Promise<boolean> => {
    if (!user) {
      setErrorMessage('Usuário não autenticado')
      return false
    }

    try {
      clearError()

      // Verificar se é categoria do sistema
      const categoria = categorias.find(c => c.id === id)
      if (categoria?.sistema) {
        setErrorMessage('Não é possível deletar categorias do sistema')
        return false
      }

      const { error: deleteError } = await supabase
        .from('categoria')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('sistema', false) // Apenas categorias não-sistema

      if (deleteError) {
        setErrorMessage(`Erro ao deletar categoria: ${deleteError.message}`)
        return false
      }

      // Atualizar lista local
      setCategorias(prev => prev.filter(cat => cat.id !== id))
      return true
    } catch (err) {
      setErrorMessage(`Erro inesperado: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
      return false
    }
  }

  // Filtrar categorias por tipo
  const getCategoriasbyTipo = (tipo: TipoCategoria): Categoria[] => {
    return categorias.filter(cat => cat.tipo === tipo)
  }

  // Refresh manual
  const refreshCategorias = async () => {
    await fetchCategorias()
  }

  // Carregar categorias quando usuário mudar
  useEffect(() => {
    fetchCategorias()
  }, [user])

  // Escutar mudanças em tempo real
  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel('categorias-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categoria',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Categoria change detected:', payload)
          fetchCategorias()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  return {
    categorias,
    loading,
    error,
    addCategoria,
    updateCategoria,
    deleteCategoria,
    refreshCategorias,
    getCategoriasbyTipo
  }
}