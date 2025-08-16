import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useContas } from './useContas'
import { useCategorias } from './useCategorias'
import { useTransacoes } from './useTransacoes'

interface DadosLocais {
  contas?: any[]
  categorias?: any[]
  transacoes?: any[]
  cartoes?: any[]
  compras?: any[]
  parcelas?: any[]
  metas?: any[]
}

interface UseMigracaoDadosReturn {
  isMigrating: boolean
  migrationError: string | null
  migrarDadosLocais: (dadosLocais: DadosLocais) => Promise<boolean>
  hasLocalData: () => boolean
  exportarDados: () => string
  importarDados: (jsonData: string) => Promise<boolean>
}

export const useMigracaoDados = (): UseMigracaoDadosReturn => {
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationError, setMigrationError] = useState<string | null>(null)
  
  const { user } = useAuth()
  const { addConta, contas } = useContas()
  const { addCategoria, categorias } = useCategorias()
  const { addTransacao, transacoes } = useTransacoes()

  const setError = (message: string) => {
    console.error('Migração error:', message)
    setMigrationError(message)
  }

  const clearError = () => setMigrationError(null)

  // Verificar se há dados locais para migrar
  const hasLocalData = (): boolean => {
    const keys = [
      'financeApp_contas',
      'financeApp_categorias', 
      'financeApp_transacoes',
      'financeApp_cartoes',
      'financeApp_compras',
      'financeApp_metas'
    ]
    
    return keys.some(key => {
      const data = localStorage.getItem(key)
      return data && data !== '[]' && data !== 'null'
    })
  }

  // Migrar dados do localStorage para Supabase
  const migrarDadosLocais = async (dadosLocais: DadosLocais): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado')
      return false
    }

    try {
      setIsMigrating(true)
      clearError()

      let migracaoSucesso = true

      // 1. Migrar categorias primeiro (pois transações dependem delas)
      if (dadosLocais.categorias && dadosLocais.categorias.length > 0) {
        console.log('Migrando categorias...')
        
        for (const categoria of dadosLocais.categorias) {
          // Verificar se categoria já existe (evitar duplicatas)
          const categoriaExistente = categorias.find(c => 
            c.nome.toLowerCase() === categoria.nome.toLowerCase()
          )
          
          if (!categoriaExistente) {
            const resultado = await addCategoria({
              nome: categoria.nome,
              tipo: categoria.tipo,
              sistema: categoria.sistema || false,
              orcamento_mensal: categoria.orcamento_mensal || null
            })
            
            if (!resultado) {
              migracaoSucesso = false
              console.warn(`Falha ao migrar categoria: ${categoria.nome}`)
            }
          }
        }
      }

      // 2. Migrar contas
      if (dadosLocais.contas && dadosLocais.contas.length > 0) {
        console.log('Migrando contas...')
        
        for (const conta of dadosLocais.contas) {
          // Verificar se conta já existe
          const contaExistente = contas.find(c => 
            c.nome.toLowerCase() === conta.nome.toLowerCase()
          )
          
          if (!contaExistente) {
            const resultado = await addConta({
              nome: conta.nome,
              saldo_inicial: conta.saldo_inicial || 0,
              data_inicial: conta.data_inicial || new Date().toISOString().split('T')[0],
              ativo: conta.ativo !== false
            })
            
            if (!resultado) {
              migracaoSucesso = false
              console.warn(`Falha ao migrar conta: ${conta.nome}`)
            }
          }
        }
      }

      // 3. Migrar transações (após contas e categorias)
      if (dadosLocais.transacoes && dadosLocais.transacoes.length > 0) {
        console.log('Migrando transações...')
        
        for (const transacao of dadosLocais.transacoes) {
          // Verificar se transação já existe (por descrição e data)
          const transacaoExistente = transacoes.find(t => 
            t.descricao === transacao.descricao && 
            t.data === transacao.data &&
            t.valor === transacao.valor
          )
          
          if (!transacaoExistente) {
            const resultado = await addTransacao({
              conta_id: transacao.conta_id,
              data: transacao.data,
              valor: transacao.valor,
              categoria_id: transacao.categoria_id,
              tipo: transacao.tipo,
              descricao: transacao.descricao || '',
              transferencia_par_id: transacao.transferencia_par_id || null,
              previsto: transacao.previsto || false,
              realizado: transacao.realizado !== false,
              recorrencia: transacao.recorrencia || null,
              meta_saldo_inicial: transacao.meta_saldo_inicial || false,
              meta_pagamento: transacao.meta_pagamento || false,
              cartao_id: transacao.cartao_id || null,
              competencia_fatura: transacao.competencia_fatura || null
            })
            
            if (!resultado) {
              migracaoSucesso = false
              console.warn(`Falha ao migrar transação: ${transacao.descricao}`)
            }
          }
        }
      }

      if (migracaoSucesso) {
        console.log('✅ Migração concluída com sucesso!')
        
        // Opcional: Limpar dados locais após migração bem-sucedida
        // localStorage.removeItem('financeApp_contas')
        // localStorage.removeItem('financeApp_categorias')
        // localStorage.removeItem('financeApp_transacoes')
        
        return true
      } else {
        setError('Alguns dados não puderam ser migrados. Verifique o console para detalhes.')
        return false
      }

    } catch (error) {
      setError(`Erro durante migração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      return false
    } finally {
      setIsMigrating(false)
    }
  }

  // Exportar dados atuais para JSON
  const exportarDados = (): string => {
    const dadosExport = {
      timestamp: new Date().toISOString(),
      user_id: user?.id,
      email: user?.email,
      dados: {
        contas,
        categorias,
        transacoes
      }
    }
    
    return JSON.stringify(dadosExport, null, 2)
  }

  // Importar dados de JSON
  const importarDados = async (jsonData: string): Promise<boolean> => {
    try {
      setIsMigrating(true)
      clearError()

      const dadosImport = JSON.parse(jsonData)
      
      if (!dadosImport.dados) {
        setError('Formato de dados inválido')
        return false
      }

      return await migrarDadosLocais(dadosImport.dados)
    } catch (error) {
      setError(`Erro ao importar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      return false
    } finally {
      setIsMigrating(false)
    }
  }

  return {
    isMigrating,
    migrationError,
    migrarDadosLocais,
    hasLocalData,
    exportarDados,
    importarDados
  }
}