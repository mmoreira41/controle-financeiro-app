import { supabase } from '../lib/supabase'

// Script para inserir categorias globais diretamente no banco
export const insertGlobalCategoriesDirectly = async () => {
  console.log('🚀 EXECUTANDO INSERÇÃO DIRETA DAS 33 CATEGORIAS GLOBAIS...')
  
  const globalCategories = [
    // ENTRADAS (10)
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
    
    // SAÍDAS (13)
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
    
    // INVESTIMENTOS (7)
    { nome: 'Reserva para Férias', tipo: 'Investimento', sistema: false },
    { nome: 'Troca de Carro', tipo: 'Investimento', sistema: false },
    { nome: 'Reforma da Casa', tipo: 'Investimento', sistema: false },
    { nome: 'Fundo de Reserva', tipo: 'Investimento', sistema: false },
    { nome: 'Investimento 1', tipo: 'Investimento', sistema: false },
    { nome: 'Serviços', tipo: 'Investimento', sistema: false },
    { nome: 'Serviços 2', tipo: 'Investimento', sistema: false },
    
    // SISTEMA (3)
    { nome: 'Transferência', tipo: 'Transferencia', sistema: true },
    { nome: 'Saldo Inicial', tipo: 'Transferencia', sistema: true },
    { nome: 'Pagamento de Cartão', tipo: 'Transferencia', sistema: true }
  ]
  
  try {
    // Primeiro verificar se já existem categorias globais
    const { data: existing, error: checkError } = await supabase
      .from('categoria')
      .select('nome, tipo')
      .is('user_id', null)
    
    if (checkError) {
      console.error('❌ Erro ao verificar categorias existentes:', checkError)
      return false
    }
    
    console.log(`📊 Encontradas ${existing?.length || 0} categorias globais existentes`)
    
    // Filtrar categorias que ainda não existem
    const existingSet = new Set(existing?.map(cat => `${cat.nome}|${cat.tipo}`) || [])
    const categoriesToInsert = globalCategories.filter(cat => 
      !existingSet.has(`${cat.nome}|${cat.tipo}`)
    )
    
    if (categoriesToInsert.length === 0) {
      console.log('✅ Todas as categorias globais já existem!')
      return true
    }
    
    console.log(`🔄 Inserindo ${categoriesToInsert.length} categorias globais faltantes...`)
    console.log('📝 Categorias a inserir:', categoriesToInsert.map(c => c.nome).slice(0, 5), '...')
    
    // Inserir categorias com user_id = null (globais)
    const categoriasComUserNull = categoriesToInsert.map(cat => ({
      ...cat,
      user_id: null,
      orcamento_mensal: null
    }))
    
    const { data, error: insertError } = await supabase
      .from('categoria')
      .insert(categoriasComUserNull)
      .select()
    
    if (insertError) {
      console.error('❌ Erro ao inserir categorias globais:', insertError)
      console.error('Detalhes:', insertError.message)
      return false
    }
    
    console.log(`✅ ${data?.length || 0} categorias globais inseridas com sucesso!`)
    console.log('🎉 CATEGORIAS GLOBAIS DISPONÍVEIS PARA TODOS OS USUÁRIOS!')
    
    return true
    
  } catch (error) {
    console.error('💥 Erro inesperado ao inserir categorias globais:', error)
    return false
  }
}

// Função para executar via console do navegador
export const executeGlobalCategoriesInsert = () => {
  console.log('🔥 EXECUTANDO INSERÇÃO MANUAL DAS CATEGORIAS GLOBAIS...')
  insertGlobalCategoriesDirectly()
    .then(success => {
      if (success) {
        console.log('✅ SUCESSO! Recarregue a página para ver as categorias.')
      } else {
        console.log('❌ FALHOU! Verifique os erros acima.')
      }
    })
    .catch(err => {
      console.error('💥 ERRO FATAL:', err)
    })
}

// Auto-executar se estiver em desenvolvimento
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  // Disponibilizar globalmente para execução manual
  (window as any).insertGlobalCategories = executeGlobalCategoriesInsert
  console.log('🔧 Execute no console: insertGlobalCategories()')
}