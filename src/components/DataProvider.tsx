import React, { createContext, useContext } from 'react'
import { useContas, ContaBancaria } from '../hooks/useContas'
import { useCategorias, Categoria } from '../hooks/useCategorias'
import { useTransacoes, TransacaoBanco } from '../hooks/useTransacoes'
import { useMigracaoDados } from '../hooks/useMigracaoDados'

interface DataContextType {
  // Contas
  contas: ContaBancaria[]
  contasLoading: boolean
  contasError: string | null
  addConta: (conta: Omit<ContaBancaria, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<ContaBancaria | null>
  updateConta: (id: string, updates: Partial<Omit<ContaBancaria, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<boolean>
  deleteConta: (id: string) => Promise<boolean>
  refreshContas: () => Promise<void>

  // Categorias
  categorias: Categoria[]
  categoriasLoading: boolean
  categoriasError: string | null
  addCategoria: (categoria: Omit<Categoria, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Categoria | null>
  updateCategoria: (id: string, updates: Partial<Omit<Categoria, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sistema'>>) => Promise<boolean>
  deleteCategoria: (id: string) => Promise<boolean>
  refreshCategorias: () => Promise<void>
  getCategoriasbyTipo: (tipo: any) => Categoria[]

  // Transações
  transacoes: TransacaoBanco[]
  transacoesLoading: boolean
  transacoesError: string | null
  addTransacao: (transacao: Omit<TransacaoBanco, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<TransacaoBanco | null>
  updateTransacao: (id: string, updates: Partial<Omit<TransacaoBanco, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<boolean>
  deleteTransacao: (id: string) => Promise<boolean>
  getTransacoesbyConta: (contaId: string) => TransacaoBanco[]
  getTransacoesbyPeriodo: (dataInicio: string, dataFim: string) => TransacaoBanco[]
  calcularSaldoConta: (contaId: string, dataLimite?: string) => number
  refreshTransacoes: () => Promise<void>

  // Migração
  isMigrating: boolean
  migrationError: string | null
  migrarDadosLocais: (dadosLocais: any) => Promise<boolean>
  hasLocalData: () => boolean
  exportarDados: () => string
  importarDados: (jsonData: string) => Promise<boolean>

  // Estado geral
  isLoading: boolean
  hasError: boolean
  globalError: string | null
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export const useData = () => {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

interface DataProviderProps {
  children: React.ReactNode
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  // Hooks para dados
  const contasHook = useContas()
  const categoriasHook = useCategorias()
  const transacoesHook = useTransacoes()
  const migracaoHook = useMigracaoDados()

  // Estado geral
  const isLoading = contasHook.loading || categoriasHook.loading || transacoesHook.loading || migracaoHook.isMigrating
  const hasError = !!(contasHook.error || categoriasHook.error || transacoesHook.error || migracaoHook.migrationError)
  const globalError = contasHook.error || categoriasHook.error || transacoesHook.error || migracaoHook.migrationError

  const value: DataContextType = {
    // Contas
    contas: contasHook.contas,
    contasLoading: contasHook.loading,
    contasError: contasHook.error,
    addConta: contasHook.addConta,
    updateConta: contasHook.updateConta,
    deleteConta: contasHook.deleteConta,
    refreshContas: contasHook.refreshContas,

    // Categorias
    categorias: categoriasHook.categorias,
    categoriasLoading: categoriasHook.loading,
    categoriasError: categoriasHook.error,
    addCategoria: categoriasHook.addCategoria,
    updateCategoria: categoriasHook.updateCategoria,
    deleteCategoria: categoriasHook.deleteCategoria,
    refreshCategorias: categoriasHook.refreshCategorias,
    getCategoriasbyTipo: categoriasHook.getCategoriasbyTipo,

    // Transações
    transacoes: transacoesHook.transacoes,
    transacoesLoading: transacoesHook.loading,
    transacoesError: transacoesHook.error,
    addTransacao: transacoesHook.addTransacao,
    updateTransacao: transacoesHook.updateTransacao,
    deleteTransacao: transacoesHook.deleteTransacao,
    getTransacoesbyConta: transacoesHook.getTransacoesbyConta,
    getTransacoesbyPeriodo: transacoesHook.getTransacoesbyPeriodo,
    calcularSaldoConta: transacoesHook.calcularSaldoConta,
    refreshTransacoes: transacoesHook.refreshTransacoes,

    // Migração
    isMigrating: migracaoHook.isMigrating,
    migrationError: migracaoHook.migrationError,
    migrarDadosLocais: migracaoHook.migrarDadosLocais,
    hasLocalData: migracaoHook.hasLocalData,
    exportarDados: migracaoHook.exportarDados,
    importarDados: migracaoHook.importarDados,

    // Estado geral
    isLoading,
    hasError,
    globalError
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}