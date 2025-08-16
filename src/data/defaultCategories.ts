export interface DefaultCategory {
  id: string;
  nome: string;
  tipo: 'Entrada' | 'Saida' | 'Investimento' | 'Transferencia' | 'Estorno';
  sistema: boolean;
  orcamento_mensal: number | null;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  // CATEGORIAS DE ENTRADA (10 itens)
  {
    id: "cat-entrada-001",
    nome: "Salário",
    tipo: "Entrada",
    sistema: false,
    orcamento_mensal: null
  },
  {
    id: "cat-entrada-002",
    nome: "Hora Extra",
    tipo: "Entrada",
    sistema: false,
    orcamento_mensal: null
  },
  {
    id: "cat-entrada-003",
    nome: "13º Salário",
    tipo: "Entrada",
    sistema: false,
    orcamento_mensal: null
  },
  {
    id: "cat-entrada-004",
    nome: "Férias",
    tipo: "Entrada",
    sistema: false,
    orcamento_mensal: null
  },
  {
    id: "cat-entrada-005",
    nome: "Bonificação",
    tipo: "Entrada",
    sistema: false,
    orcamento_mensal: null
  },
  {
    id: "cat-entrada-006",
    nome: "Aluguel Recebido",
    tipo: "Entrada",
    sistema: false,
    orcamento_mensal: null
  },
  {
    id: "cat-entrada-007",
    nome: "Pró Labore",
    tipo: "Entrada",
    sistema: false,
    orcamento_mensal: null
  },
  {
    id: "cat-entrada-008",
    nome: "Distribuição de Lucros",
    tipo: "Entrada",
    sistema: false,
    orcamento_mensal: null
  },
  {
    id: "cat-entrada-009",
    nome: "Rendimento de Investimentos",
    tipo: "Entrada",
    sistema: false,
    orcamento_mensal: null
  },
  {
    id: "cat-entrada-010",
    nome: "Outras Entradas",
    tipo: "Entrada",
    sistema: false,
    orcamento_mensal: null
  },

  // CATEGORIAS DE SAÍDA (13 itens)
  {
    id: "cat-saida-001",
    nome: "Dízimo e Ofertas",
    tipo: "Saida",
    sistema: false,
    orcamento_mensal: null
  },
  {
    id: "cat-saida-002",
    nome: "Moradia",
    tipo: "Saida",
    sistema: false,
    orcamento_mensal: null
  },
  {
    id: "cat-saida-003",
    nome: "Alimentação",
    tipo: "Saida",
    sistema: false,
    orcamento_mensal: null
  },
  {
    id: "cat-saida-004",
    nome: "Transporte",
    tipo: "Saida",
    sistema: false,
    orcamento_mensal: null
  },
  {
    id: "cat-saida-005",
    nome: "Saúde",
    tipo: "Saida",
    sistema: false,
    orcamento_mensal: null
  },
  {
    id: "cat-saida-006",
    nome: "Educação",
    tipo: "Saida",
    sistema: false,
    orcamento_mensal: null
  },
  {
    id: "cat-saida-007",
    nome: "Lazer e Entretenimento",
    tipo: "Saida",
    sistema: false,
    orcamento_mensal: null
  },
  {
    id: "cat-saida-008",
    nome: "Dívidas e Obrigações",
    tipo: "Saida",
    sistema: false,
    orcamento_mensal: null
  },
  {
    id: "cat-saida-009",
    nome: "Impostos e Taxas",
    tipo: "Saida",
    sistema: false,
    orcamento_mensal: null
  },
  {
    id: "cat-saida-010",
    nome: "Despesas Pessoais",
    tipo: "Saida",
    sistema: false,
    orcamento_mensal: null
  },
  {
    id: "cat-saida-011",
    nome: "Presentes",
    tipo: "Saida",
    sistema: false,
    orcamento_mensal: null
  },
  {
    id: "cat-saida-012",
    nome: "Pet",
    tipo: "Saida",
    sistema: false,
    orcamento_mensal: null
  },
  {
    id: "cat-saida-013",
    nome: "Outras Despesas",
    tipo: "Saida",
    sistema: false,
    orcamento_mensal: null
  },

  // CATEGORIAS DE INVESTIMENTO (7 itens)
  {
    id: "cat-invest-001",
    nome: "Reserva para Férias",
    tipo: "Investimento",
    sistema: false,
    orcamento_mensal: null
  },
  {
    id: "cat-invest-002",
    nome: "Troca de Carro",
    tipo: "Investimento",
    sistema: false,
    orcamento_mensal: null
  },
  {
    id: "cat-invest-003",
    nome: "Reforma da Casa",
    tipo: "Investimento",
    sistema: false,
    orcamento_mensal: null
  },
  {
    id: "cat-invest-004",
    nome: "Fundo de Reserva",
    tipo: "Investimento",
    sistema: false,
    orcamento_mensal: null
  },
  {
    id: "cat-invest-005",
    nome: "Investimento 1",
    tipo: "Investimento",
    sistema: false,
    orcamento_mensal: null
  },
  {
    id: "cat-invest-006",
    nome: "Serviços",
    tipo: "Investimento",
    sistema: false,
    orcamento_mensal: null
  },
  {
    id: "cat-invest-007",
    nome: "Serviços 2",
    tipo: "Investimento",
    sistema: false,
    orcamento_mensal: null
  },

  // CATEGORIAS CRÍTICAS - SISTEMA=TRUE (3 itens)
  {
    id: "cat-sistema-001",
    nome: "Transferência",
    tipo: "Transferencia",
    sistema: true,
    orcamento_mensal: null
  },
  {
    id: "cat-sistema-002",
    nome: "Saldo Inicial",
    tipo: "Transferencia",
    sistema: true,
    orcamento_mensal: null
  },
  {
    id: "cat-sistema-003",
    nome: "Pagamento de Cartão",
    tipo: "Transferencia",
    sistema: true,
    orcamento_mensal: null
  }
];

// Total: 33 categorias (10 Entrada + 13 Saída + 7 Investimento + 3 Sistema)
export const TOTAL_DEFAULT_CATEGORIES = DEFAULT_CATEGORIES.length;