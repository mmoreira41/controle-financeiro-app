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
  { id: "global-cat-entrada-001", nome: "Salário", tipo: "Entrada", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "global-cat-entrada-002", nome: "Hora Extra", tipo: "Entrada", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "global-cat-entrada-003", nome: "13º Salário", tipo: "Entrada", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "global-cat-entrada-004", nome: "Férias", tipo: "Entrada", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "global-cat-entrada-005", nome: "Bonificação", tipo: "Entrada", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "global-cat-entrada-006", nome: "Aluguel Recebido", tipo: "Entrada", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "global-cat-entrada-007", nome: "Pró Labore", tipo: "Entrada", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "global-cat-entrada-008", nome: "Distribuição de Lucros", tipo: "Entrada", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "global-cat-entrada-009", nome: "Rendimento de Investimentos", tipo: "Entrada", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "global-cat-entrada-010", nome: "Outras Entradas", tipo: "Entrada", sistema: false, orcamento_mensal: null, user_id: null },

  // CATEGORIAS DE SAÍDA (13 itens)
  { id: "global-cat-saida-001", nome: "Dízimo e Ofertas", tipo: "Saida", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "global-cat-saida-002", nome: "Moradia", tipo: "Saida", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "global-cat-saida-003", nome: "Alimentação", tipo: "Saida", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "global-cat-saida-004", nome: "Transporte", tipo: "Saida", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "global-cat-saida-005", nome: "Saúde", tipo: "Saida", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "global-cat-saida-006", nome: "Educação", tipo: "Saida", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "global-cat-saida-007", nome: "Lazer e Entretenimento", tipo: "Saida", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "global-cat-saida-008", nome: "Dívidas e Obrigações", tipo: "Saida", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "global-cat-saida-009", nome: "Impostos e Taxas", tipo: "Saida", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "global-cat-saida-010", nome: "Despesas Pessoais", tipo: "Saida", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "global-cat-saida-011", nome: "Presentes", tipo: "Saida", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "global-cat-saida-012", nome: "Pet", tipo: "Saida", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "global-cat-saida-013", nome: "Outras Despesas", tipo: "Saida", sistema: false, orcamento_mensal: null, user_id: null },

  // CATEGORIAS DE INVESTIMENTO (7 itens)
  { id: "global-cat-invest-001", nome: "Reserva para Férias", tipo: "Investimento", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "global-cat-invest-002", nome: "Troca de Carro", tipo: "Investimento", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "global-cat-invest-003", nome: "Reforma da Casa", tipo: "Investimento", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "global-cat-invest-004", nome: "Fundo de Reserva", tipo: "Investimento", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "global-cat-invest-005", nome: "Investimento 1", tipo: "Investimento", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "global-cat-invest-006", nome: "Serviços", tipo: "Investimento", sistema: false, orcamento_mensal: null, user_id: null },
  { id: "global-cat-invest-007", nome: "Serviços 2", tipo: "Investimento", sistema: false, orcamento_mensal: null, user_id: null },

  // CATEGORIAS CRÍTICAS - SISTEMA=TRUE (3 itens)
  { id: "global-cat-sistema-001", nome: "Transferência", tipo: "Transferencia", sistema: true, orcamento_mensal: null, user_id: null },
  { id: "global-cat-sistema-002", nome: "Saldo Inicial", tipo: "Transferencia", sistema: true, orcamento_mensal: null, user_id: null },
  { id: "global-cat-sistema-003", nome: "Pagamento de Cartão", tipo: "Transferencia", sistema: true, orcamento_mensal: null, user_id: null }
];

// Function to ensure global categories exist in database
export const ensureGlobalCategoriesExist = async (): Promise<void> => {
  try {
    // Check if global categories already exist
    const { data: existingGlobalCategories, error: checkError } = await supabase
      .from('categoria')
      .select('id')
      .is('user_id', null)
      .limit(1)

    if (checkError) {
      console.warn('Error checking global categories:', checkError.message)
      return
    }

    // If global categories already exist, don't insert again
    if (existingGlobalCategories && existingGlobalCategories.length > 0) {
      console.log('✅ Global categories already exist')
      return
    }

    console.log('🔄 Inserting global categories...')

    // Insert all global categories
    const { error: insertError } = await supabase
      .from('categoria')
      .insert(GLOBAL_CATEGORIES)

    if (insertError) {
      console.error('Error inserting global categories:', insertError.message)
    } else {
      console.log(`✅ ${GLOBAL_CATEGORIES.length} global categories inserted successfully!`)
    }
  } catch (err) {
    console.error('Unexpected error ensuring global categories:', err)
  }
}

// Total: 33 categorias (10 Entrada + 13 Saída + 7 Investimento + 3 Sistema)
export const TOTAL_GLOBAL_CATEGORIES = GLOBAL_CATEGORIES.length;