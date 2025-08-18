import { supabase } from '../lib/supabase'

export interface GlobalCategory {
  id: string;
  nome: string;
  tipo: 'Entrada' | 'Saida' | 'Investimento' | 'Transferencia' | 'Estorno';
  sistema: boolean;
  orcamento_mensal: number | null;
  user_id: null; // Global categories have null user_id
}

export const GLOBAL_CATEGORIES: GlobalCategory[] = [
  // CATEGORIAS DE ENTRADA (10 itens)
  { id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", nome: "Salário", tipo: "Entrada", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "b2c3d4e5-f6g7-8901-bcde-f12345678901", nome: "Hora Extra", tipo: "Entrada", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "c3d4e5f6-g7h8-9012-cdef-123456789012", nome: "13º Salário", tipo: "Entrada", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "d4e5f6g7-h8i9-0123-defa-234567890123", nome: "Férias", tipo: "Entrada", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "e5f6g7h8-i9j0-1234-efab-345678901234", nome: "Bonificação", tipo: "Entrada", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "f6g7h8i9-j0k1-2345-fabc-456789012345", nome: "Aluguel Recebido", tipo: "Entrada", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "g7h8i9j0-k1l2-3456-abcd-567890123456", nome: "Pró Labore", tipo: "Entrada", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "h8i9j0k1-l2m3-4567-bcde-678901234567", nome: "Distribuição de Lucros", tipo: "Entrada", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "i9j0k1l2-m3n4-5678-cdef-789012345678", nome: "Rendimento de Investimentos", tipo: "Entrada", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "j0k1l2m3-n4o5-6789-defa-890123456789", nome: "Outras Entradas", tipo: "Entrada", sistema: false, orcamento_mensal: null, user_id: null },

  // CATEGORIAS DE SAÍDA (13 itens)
  { id: "k1l2m3n4-o5p6-7890-efab-901234567890", nome: "Dízimo e Ofertas", tipo: "Saida", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "l2m3n4o5-p6q7-8901-fabc-012345678901", nome: "Moradia", tipo: "Saida", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "m3n4o5p6-q7r8-9012-abcd-123456789012", nome: "Alimentação", tipo: "Saida", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "n4o5p6q7-r8s9-0123-bcde-234567890123", nome: "Transporte", tipo: "Saida", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "o5p6q7r8-s9t0-1234-cdef-345678901234", nome: "Saúde", tipo: "Saida", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "p6q7r8s9-t0u1-2345-defa-456789012345", nome: "Educação", tipo: "Saida", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "q7r8s9t0-u1v2-3456-efab-567890123456", nome: "Lazer e Entretenimento", tipo: "Saida", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "r8s9t0u1-v2w3-4567-fabc-678901234567", nome: "Dívidas e Obrigações", tipo: "Saida", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "s9t0u1v2-w3x4-5678-abcd-789012345678", nome: "Impostos e Taxas", tipo: "Saida", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "t0u1v2w3-x4y5-6789-bcde-890123456789", nome: "Despesas Pessoais", tipo: "Saida", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "u1v2w3x4-y5z6-7890-cdef-901234567890", nome: "Presentes", tipo: "Saida", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "v2w3x4y5-z6a7-8901-defa-012345678901", nome: "Pet", tipo: "Saida", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "w3x4y5z6-a7b8-9012-efab-123456789012", nome: "Outras Despesas", tipo: "Saida", sistema: false, orcamento_mensal: null, user_id: null },

  // CATEGORIAS DE INVESTIMENTO (7 itens)
  { id: "x4y5z6a7-b8c9-0123-fabc-234567890123", nome: "Reserva para Férias", tipo: "Investimento", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "y5z6a7b8-c9d0-1234-abcd-345678901234", nome: "Troca de Carro", tipo: "Investimento", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "z6a7b8c9-d0e1-2345-bcde-456789012345", nome: "Reforma da Casa", tipo: "Investimento", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "a7b8c9d0-e1f2-3456-cdef-567890123456", nome: "Fundo de Reserva", tipo: "Investimento", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "b8c9d0e1-f2g3-4567-defa-678901234567", nome: "Investimento 1", tipo: "Investimento", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "c9d0e1f2-g3h4-5678-efab-789012345678", nome: "Serviços", tipo: "Investimento", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "d0e1f2g3-h4i5-6789-fabc-890123456789", nome: "Serviços 2", tipo: "Investimento", sistema: false, orcamento_mensal: null, user_id: null },

  // CATEGORIAS CRÍTICAS - SISTEMA=TRUE (3 itens)
  { id: "e1f2g3h4-i5j6-7890-abcd-901234567890", nome: "Transferência", tipo: "Transferencia", sistema: true, orcamento_mensal: null, user_id: null },
  { id: "f2g3h4i5-j6k7-8901-bcde-012345678901", nome: "Saldo Inicial", tipo: "Transferencia", sistema: true, orcamento_mensal: null, user_id: null },
  { id: "g3h4i5j6-k7l8-9012-cdef-123456789012", nome: "Pagamento de Cartão", tipo: "Transferencia", sistema: true, orcamento_mensal: null, user_id: null }
];

// 🔧 FUNÇÃO CRÍTICA: Garantir categorias globais existem
export const ensureGlobalCategoriesExist = async (): Promise<void> => {
  console.log('🔧 Verificando categorias globais...')
  
  try {
    // Verificar se categorias globais já existem
    const { data: existingCategories, error: checkError } = await supabase
      .from('categoria')
      .select('id, nome')
      .is('user_id', null)
      .limit(5)

    if (checkError) {
      console.warn('❌ Erro ao verificar categorias globais:', checkError.message)
      return
    }

    console.log(`📊 Encontradas ${existingCategories?.length || 0} categorias globais`)

    // Se já existem, não inserir novamente
    if (existingCategories && existingCategories.length > 0) {
      console.log('✅ Categorias globais já existem!')
      return
    }

    console.log(`🔄 Inserindo ${GLOBAL_CATEGORIES.length} categorias globais...`)

    // Inserir todas as categorias globais
    const { error: insertError } = await supabase
      .from('categoria')
      .insert(GLOBAL_CATEGORIES)

    if (insertError) {
      console.error('❌ Erro ao inserir categorias globais:', insertError.message)
    } else {
      console.log(`✅ ${GLOBAL_CATEGORIES.length} categorias globais inseridas!`)
    }
  } catch (err) {
    console.error('💥 Erro ao garantir categorias globais:', err)
  }
}

export const TOTAL_GLOBAL_CATEGORIES = GLOBAL_CATEGORIES.length;