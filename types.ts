

export enum TipoCategoria {
  Entrada = 'Entrada',
  Saida = 'Saida',
  Investimento = 'Investimento',
  Transferencia = 'Transferencia',
  Estorno = 'Estorno',
}

export enum BandeiraCartao {
  Visa = 'Visa',
  Mastercard = 'Mastercard',
  Elo = 'Elo',
  Amex = 'Amex',
  Hipercard = 'Hipercard',
  Outra = 'Outra',
}

export interface ContaBancaria {
  id: string;
  nome: string;
  saldo_inicial: number; // Will be deprecated in logic, but kept for migration/structure
  data_inicial: string; // YYYY-MM-DD
  ativo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Cartao {
  id: string;
  apelido: string;
  dia_fechamento: number;
  dia_vencimento: number;
  limite: number | null;
  bandeira: BandeiraCartao;
  cor: string; // hex color
  conta_id_padrao?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Categoria {
  id: string;
  nome: string;
  tipo: TipoCategoria;
  sistema: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TransacaoBanco {
  id: string;
  conta_id: string;
  data: string; // YYYY-MM-DD
  valor: number;
  categoria_id: string;
  tipo: TipoCategoria;
  descricao: string;
  transferencia_par_id?: string | null;
  previsto: boolean;
  realizado: boolean;
  // New fields for bill payments
  cartao_id?: string | null;
  competencia_fatura?: string | null; // YYYY-MM
  meta_pagamento?: boolean;
  // New field for initial balance transaction
  meta_saldo_inicial?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompraCartao {
  id: string;
  cartao_id: string;
  data_compra: string; // YYYY-MM-DD
  valor_total: number;
  parcelas_total: number;
  categoria_id: string;
  descricao: string;
  estorno: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ParcelaCartao {
  id: string;
  compra_id: string;
  n_parcela: number;
  valor_parcela: number;
  competencia_fatura: string; // YYYY-MM
  createdAt?: string;
  updatedAt?: string;
}

export interface Kpi {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

export type Page = 'contas-extrato' | 'cartoes' | 'fluxo' | 'resumo' | 'categorias';

export type ModalState = {
    modal: string | null;
    data?: any;
};

export type NavigationState = {
    viewId?: 'all' | string;
    month?: string;
    filters?: any;
};
