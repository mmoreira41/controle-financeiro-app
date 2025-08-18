import { createClient } from '@supabase/supabase-js'

// 🔧 CORREÇÃO CRÍTICA: Validação rigorosa das variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

// 🚨 DEBUG: Log das variáveis para identificar problemas
console.log('🔍 DEBUG Supabase Config:')
console.log('URL:', supabaseUrl)
console.log('Key exists:', !!supabaseKey)
console.log('Key first chars:', supabaseKey?.substring(0, 20) + '...')
console.log('URL ends with .supabase.co:', supabaseUrl?.endsWith('.supabase.co'))

// ✅ VALIDAÇÃO ROBUSTA: Verificar se variáveis estão corretas
if (!supabaseUrl || !supabaseKey) {
  console.error('🚨 ERRO CRÍTICO: Variáveis do Supabase não configuradas!')
  console.error('Verifique o arquivo .env.local na raiz do projeto')
  console.error('URL configurada:', supabaseUrl || 'UNDEFINED')
  console.error('Key configurada:', supabaseKey ? 'EXISTS' : 'UNDEFINED')
  throw new Error('Configuração do Supabase incompleta')
}

if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.error('🚨 URL do Supabase inválida:', supabaseUrl)
  throw new Error('URL do Supabase deve ser https://xxx.supabase.co')
}

if (!supabaseKey.startsWith('eyJ')) {
  console.error('🚨 Chave Supabase inválida - deve começar com eyJ')
  throw new Error('Chave ANON do Supabase inválida')
}

// 🚀 Criar cliente com configurações robustas
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    debug: true // 🔧 Ativar debug para autenticação
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// 🧪 FUNÇÃO DE TESTE DE CONEXÃO
export const testarConexaoSupabase = async (): Promise<boolean> => {
  try {
    console.log('🧪 Testando conexão com Supabase...')
    
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Erro na conexão:', error.message)
      return false
    }
    
    console.log('✅ Conexão Supabase OK!')
    console.log('Sessão atual:', data.session ? 'Ativa' : 'Nenhuma')
    return true
    
  } catch (err) {
    console.error('💥 Erro crítico na conexão:', err)
    return false
  }
}

// 🔧 FUNÇÃO DE CADASTRO COM DEBUG COMPLETO
export const cadastrarUsuario = async (email: string, password: string, nome?: string) => {
  try {
    console.log('📝 Iniciando cadastro para:', email)
    console.log('Password length:', password?.length || 0)
    
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password,
      options: {
        data: {
          nome: nome || email.split('@')[0]
        }
      }
    })
    
    if (error) {
      console.error('❌ Erro no cadastro:', error.message)
      console.error('Erro completo:', error)
      throw error
    }
    
    console.log('✅ Cadastro realizado com sucesso!')
    console.log('User ID:', data.user?.id)
    console.log('Email confirmado:', data.user?.email_confirmed_at ? 'Sim' : 'Não')
    
    return data
    
  } catch (error: any) {
    console.error('💥 Erro completo no cadastro:', error)
    throw new Error(`Erro ao criar conta: ${error.message}`)
  }
}

// 🔧 FUNÇÃO DE LOGIN COM DEBUG COMPLETO
export const fazerLogin = async (email: string, password: string) => {
  try {
    console.log('🔐 Iniciando login para:', email)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password
    })
    
    if (error) {
      console.error('❌ Erro no login:', error.message)
      console.error('Erro completo:', error)
      
      // 🔧 Mensagens de erro mais claras
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Email ou senha incorretos. Verifique suas credenciais.')
      }
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Email não confirmado. Verifique sua caixa de entrada.')
      }
      throw error
    }
    
    console.log('✅ Login realizado com sucesso!')
    console.log('User ID:', data.user?.id)
    console.log('Email:', data.user?.email)
    
    return data
    
  } catch (error: any) {
    console.error('💥 Erro completo no login:', error)
    throw new Error(`Erro ao fazer login: ${error.message}`)
  }
}

// 🔧 FUNÇÃO DE RESET DE SENHA
export const resetarSenha = async (email: string) => {
  try {
    console.log('🔄 Enviando reset de senha para:', email)
    
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`
    })
    
    if (error) {
      console.error('❌ Erro no reset:', error.message)
      throw error
    }
    
    console.log('✅ Email de reset enviado!')
    return true
    
  } catch (error: any) {
    console.error('💥 Erro no reset:', error)
    throw new Error(`Erro ao enviar reset: ${error.message}`)
  }
}

// 🚀 Types for database tables
export interface Database {
  public: {
    Tables: {
      categoria: {
        Row: {
          id: string
          user_id: string | null
          nome: string
          tipo: 'Entrada' | 'Saida' | 'Investimento' | 'Transferencia' | 'Estorno'
          sistema: boolean
          orcamento_mensal: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          nome: string
          tipo: 'Entrada' | 'Saida' | 'Investimento' | 'Transferencia' | 'Estorno'
          sistema?: boolean
          orcamento_mensal?: number | null
        }
        Update: {
          id?: string
          user_id?: string | null
          nome?: string
          tipo?: 'Entrada' | 'Saida' | 'Investimento' | 'Transferencia' | 'Estorno'
          sistema?: boolean
          orcamento_mensal?: number | null
        }
      }
      conta_bancaria: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          nome: string
          saldo_inicial: number
          data_inicial: string
          ativo?: boolean
          cor?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          nome?: string
          saldo_inicial?: number
          data_inicial?: string
          ativo?: boolean
          cor?: string | null
        }
      }
      transacao_banco: {
        Row: {
          id: string
          user_id: string
          conta_id: string
          categoria_id: string
          data: string
          valor: number
          tipo: 'Entrada' | 'Saida' | 'Investimento' | 'Transferencia' | 'Estorno'
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
        Insert: {
          id?: string
          user_id: string
          conta_id: string
          categoria_id: string
          data: string
          valor: number
          tipo: 'Entrada' | 'Saida' | 'Investimento' | 'Transferencia' | 'Estorno'
          descricao: string
          previsto?: boolean
          realizado?: boolean
          meta_saldo_inicial?: boolean
          meta_pagamento?: boolean
          recorrencia?: any | null
          transferencia_par_id?: string | null
          cartao_id?: string | null
          competencia_fatura?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          conta_id?: string
          categoria_id?: string
          data?: string
          valor?: number
          tipo?: 'Entrada' | 'Saida' | 'Investimento' | 'Transferencia' | 'Estorno'
          descricao?: string
          previsto?: boolean
          realizado?: boolean
          meta_saldo_inicial?: boolean
          meta_pagamento?: boolean
          recorrencia?: any | null
          transferencia_par_id?: string | null
          cartao_id?: string | null
          competencia_fatura?: string | null
        }
      }
    }
  }
}

// 🌐 INSERIR CATEGORIAS GLOBAIS NO BANCO (EXECUTE UMA ÚNICA VEZ)
export const inserirCategoriasGlobais = async (): Promise<boolean> => {
  console.log('🌐 Inserindo categorias globais no banco...')
  
  const categoriasGlobais = [
    // ENTRADAS (10 categorias)
    { nome: 'Salário', tipo: 'Entrada', sistema: false },
    { nome: 'Hora Extra', tipo: 'Entrada', sistema: false },
    { nome: '13º Salário', tipo: 'Entrada', sistema: false },
    { nome: 'Férias', tipo: 'Entrada', sistema: false },
    { nome: 'Bonificação', tipo: 'Entrada', sistema: false },
    { nome: 'Aluguel Recebido', tipo: 'Entrada', sistema: false },
    { nome: 'Pró Labore', tipo: 'Entrada', sistema: false },
    { nome: 'Distribuição de Lucros', tipo: 'Entrada', sistema: false },
    { nome: 'Rendimento de Investimentos', tipo: 'Entrada', sistema: false },
    { nome: 'Outras Entradas', tipo: 'Entrada', sistema: false },

    // SAÍDAS (13 categorias)
    { nome: 'Dízimo e Ofertas', tipo: 'Saida', sistema: false },
    { nome: 'Moradia', tipo: 'Saida', sistema: false },
    { nome: 'Alimentação', tipo: 'Saida', sistema: false },
    { nome: 'Transporte', tipo: 'Saida', sistema: false },
    { nome: 'Saúde', tipo: 'Saida', sistema: false },
    { nome: 'Educação', tipo: 'Saida', sistema: false },
    { nome: 'Lazer e Entretenimento', tipo: 'Saida', sistema: false },
    { nome: 'Dívidas e Obrigações', tipo: 'Saida', sistema: false },
    { nome: 'Impostos e Taxas', tipo: 'Saida', sistema: false },
    { nome: 'Despesas Pessoais', tipo: 'Saida', sistema: false },
    { nome: 'Presentes', tipo: 'Saida', sistema: false },
    { nome: 'Pet', tipo: 'Saida', sistema: false },
    { nome: 'Outras Despesas', tipo: 'Saida', sistema: false },

    // INVESTIMENTOS (7 categorias)
    { nome: 'Reserva para Férias', tipo: 'Investimento', sistema: false },
    { nome: 'Troca de Carro', tipo: 'Investimento', sistema: false },
    { nome: 'Reforma da Casa', tipo: 'Investimento', sistema: false },
    { nome: 'Fundo de Reserva', tipo: 'Investimento', sistema: false },
    { nome: 'Investimento 1', tipo: 'Investimento', sistema: false },
    { nome: 'Serviços', tipo: 'Investimento', sistema: false },
    { nome: 'Serviços 2', tipo: 'Investimento', sistema: false },

    // SISTEMA (3 categorias - NÃO EDITÁVEIS)
    { nome: 'Transferência', tipo: 'Transferencia', sistema: true },
    { nome: 'Saldo Inicial', tipo: 'Transferencia', sistema: true },
    { nome: 'Pagamento de Cartão', tipo: 'Transferencia', sistema: true }
  ]

  try {
    // 🔍 PRIMEIRO: Verificar se a tabela categoria existe e tem estrutura correta
    console.log('🔍 Verificando estrutura da tabela categoria...')
    
    const { data: testQuery, error: testError } = await supabase
      .from('categoria')
      .select('id')
      .limit(1)

    if (testError) {
      console.error('❌ ERRO CRÍTICO: Tabela categoria não acessível:', testError.message)
      console.error('💡 Possível problema: Nome da tabela, permissões RLS, ou estrutura')
      return false
    }

    console.log('✅ Tabela categoria acessível')

    // Verificar quantas categorias globais já existem
    const { data: existingGlobals, error: checkError } = await supabase
      .from('categoria')
      .select('id, nome')
      .is('user_id', null)

    if (checkError) {
      console.error('❌ Erro ao verificar categorias existentes:', checkError.message)
      return false
    }

    console.log(`📊 Categorias globais existentes: ${existingGlobais?.length || 0}`)

    // 🔧 FORÇAR INSERÇÃO SE MENOS DE 33 CATEGORIAS
    if (existingGlobais && existingGlobais.length >= 33) {
      console.log('✅ Categorias globais já existem (33+). Não inserindo novamente.')
      return true
    }

    console.log('🔄 Menos de 33 categorias encontradas. Inserindo todas as categorias globais...')

    // Inserir categorias globais (user_id = null)
    const categoriasParaInserir = categoriasGlobais.map(cat => ({
      ...cat,
      user_id: null,
      orcamento_mensal: null
    }))

    console.log(`🔄 Inserindo ${categoriasParaInserir.length} categorias globais...`)

    const { data, error: insertError } = await supabase
      .from('categoria')
      .insert(categoriasParaInserir)
      .select()

    if (insertError) {
      console.error('❌ Erro ao inserir categorias globais:', insertError.message)
      return false
    }

    console.log(`✅ ${data?.length || 0} categorias globais inseridas com sucesso!`)
    
    // Verificar total após inserção
    const { data: finalCount } = await supabase
      .from('categoria')
      .select('id')
      .is('user_id', null)

    console.log(`🎯 Total de categorias globais no banco: ${finalCount?.length || 0}`)
    return true

  } catch (error) {
    console.error('💥 Erro crítico ao inserir categorias globais:', error)
    return false
  }
}

// 🔍 VERIFICAR CATEGORIAS GLOBAIS NO BANCO
export const verificarCategoriasGlobais = async (): Promise<void> => {
  console.log('🔍 Verificando categorias globais no banco...')
  
  try {
    const { data, error } = await supabase
      .from('categoria')
      .select('id, nome, tipo, sistema, user_id')
      .is('user_id', null)
      .order('tipo', { ascending: true })
      .order('nome', { ascending: true })

    if (error) {
      console.error('❌ Erro ao verificar categorias:', error.message)
      return
    }

    console.log(`📊 Total de categorias globais encontradas: ${data?.length || 0}`)
    
    if (data && data.length > 0) {
      const porTipo = data.reduce((acc, cat) => {
        acc[cat.tipo] = (acc[cat.tipo] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      console.log('📋 Categorias por tipo:', porTipo)
      console.log('🔧 Categorias de sistema:', data.filter(c => c.sistema).map(c => c.nome))
      
      // Lista completa para debug
      console.log('📝 Lista completa:', data.map(c => `${c.tipo}: ${c.nome}`))
    } else {
      console.warn('⚠️ NENHUMA categoria global encontrada!')
    }
    
  } catch (error) {
    console.error('💥 Erro ao verificar categorias:', error)
  }
}

// 🔧 FUNÇÃO GLOBAL PARA TESTAR NO CONSOLE
(window as any).forcarInsercaoCategoriasGlobais = async () => {
  console.log('🔄 FORÇANDO inserção de categorias globais...')
  const success = await inserirCategoriasGlobais()
  if (success) {
    console.log('✅ Categorias inseridas! Verificando...')
    await verificarCategoriasGlobais()
  }
  return success
}

(window as any).verificarCategorias = verificarCategoriasGlobais

// 🌐 Executar inserção de categorias globais IMEDIATAMENTE
console.log('🔄 Verificando e inserindo categorias globais...')
inserirCategoriasGlobais().then(success => {
  if (success) {
    console.log('🎯 Sistema de categorias globais pronto!')
    // Verificar imediatamente após inserção
    setTimeout(() => verificarCategoriasGlobais(), 1000)
  } else {
    console.error('⚠️ Problema com categorias globais - verificar manualmente')
    console.log('💡 Teste manual: digite no console -> forcarInsercaoCategoriasGlobais()')
  }
})

// 🧪 Testar conexão automaticamente
testarConexaoSupabase()

console.log('🚀 Cliente Supabase inicializado com sucesso!')