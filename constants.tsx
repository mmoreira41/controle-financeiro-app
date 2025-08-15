
import React from 'react';
import { CreditCard, Landmark, Waves, BarChartBig, Shapes, HelpCircle, Target, Settings } from 'lucide-react';
import { TipoCategoria, Categoria, Page } from './types';

export const CATEGORIAS_PADRAO: Categoria[] = [
  // Entradas
  { "id": "e0a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b50", "nome": "Salário", "tipo": TipoCategoria.Entrada, "sistema": false },
  { "id": "e0a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b51", "nome": "Hora Extra", "tipo": TipoCategoria.Entrada, "sistema": false },
  { "id": "e0a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b52", "nome": "13º Salário", "tipo": TipoCategoria.Entrada, "sistema": false },
  { "id": "e0a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b53", "nome": "Férias", "tipo": TipoCategoria.Entrada, "sistema": false },
  { "id": "e0a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b54", "nome": "Bonificação", "tipo": TipoCategoria.Entrada, "sistema": false },
  { "id": "e0a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b55", "nome": "Aluguel Recebido", "tipo": TipoCategoria.Entrada, "sistema": false },
  { "id": "e0a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b56", "nome": "Pró Labore", "tipo": TipoCategoria.Entrada, "sistema": false },
  { "id": "e0a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b57", "nome": "Distribuição de Lucros", "tipo": TipoCategoria.Entrada, "sistema": false },
  { "id": "e0a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b58", "nome": "Rendimento de Investimentos", "tipo": TipoCategoria.Entrada, "sistema": false },
  { "id": "e0a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b59", "nome": "Outras Entradas", "tipo": TipoCategoria.Entrada, "sistema": false },
  // Saídas
  { "id": "s1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c50", "nome": "Dízimo e Ofertas", "tipo": TipoCategoria.Saida, "sistema": false },
  { "id": "s1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c51", "nome": "Moradia", "tipo": TipoCategoria.Saida, "sistema": false },
  { "id": "s1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c52", "nome": "Alimentação", "tipo": TipoCategoria.Saida, "sistema": false },
  { "id": "s1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c53", "nome": "Transporte", "tipo": TipoCategoria.Saida, "sistema": false },
  { "id": "s1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c54", "nome": "Saúde", "tipo": TipoCategoria.Saida, "sistema": false },
  { "id": "s1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c55", "nome": "Educação", "tipo": TipoCategoria.Saida, "sistema": false },
  { "id": "s1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c56", "nome": "Lazer e Entretenimento", "tipo": TipoCategoria.Saida, "sistema": false },
  { "id": "s1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c57", "nome": "Dívidas e Obrigações", "tipo": TipoCategoria.Saida, "sistema": false },
  { "id": "s1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c58", "nome": "Impostos e Taxas", "tipo": TipoCategoria.Saida, "sistema": false },
  { "id": "s1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c59", "nome": "Despesas Pessoais", "tipo": TipoCategoria.Saida, "sistema": false },
  { "id": "s1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c60", "nome": "Presentes", "tipo": TipoCategoria.Saida, "sistema": false },
  { "id": "s1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c61", "nome": "Pet", "tipo": TipoCategoria.Saida, "sistema": false },
  { "id": "s1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c62", "nome": "Outras Despesas", "tipo": TipoCategoria.Saida, "sistema": false },
  // Investimentos
  { "id": "i2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d60", "nome": "Reserva para Férias", "tipo": TipoCategoria.Investimento, "sistema": false },
  { "id": "i2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d61", "nome": "Troca de Carro", "tipo": TipoCategoria.Investimento, "sistema": false },
  { "id": "i2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d62", "nome": "Reforma da Casa", "tipo": TipoCategoria.Investimento, "sistema": false },
  { "id": "i2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d63", "nome": "Fundo de Reserva", "tipo": TipoCategoria.Investimento, "sistema": false },
  { "id": "i2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d64", "nome": "Investimento 1", "tipo": TipoCategoria.Investimento, "sistema": false },
  { "id": "i2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d65", "nome": "Serviços", "tipo": TipoCategoria.Investimento, "sistema": false },
  { "id": "i2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d66", "nome": "Serviços 2", "tipo": TipoCategoria.Investimento, "sistema": false },
  // Transferência (sistema)
  { "id": "t3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e70", "nome": "Transferência", "tipo": TipoCategoria.Transferencia, "sistema": true },
  { "id": "t3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e71", "nome": "Saldo Inicial", "tipo": TipoCategoria.Transferencia, "sistema": true },
  { "id": "t3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e72", "nome": "Pagamento de Cartão", "tipo": TipoCategoria.Transferencia, "sistema": true }
];

export const NAV_ITEMS: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id: 'resumo', label: 'Resumo', icon: <BarChartBig size={20} /> },
    { id: 'contas-extrato', label: 'Contas e Extrato', icon: <Landmark size={20} /> },
    { id: 'cartoes', label: 'Cartões', icon: <CreditCard size={20} /> },
    { id: 'fluxo', label: 'Fluxo de Caixa', icon: <Waves size={20} /> },
    { id: 'categorias', label: 'Categorias e Orçamentos', icon: <Shapes size={20} /> },
    { id: 'metas', label: 'Metas', icon: <Target size={20} /> },
    { id: 'configuracoes', label: 'Configurações', icon: <Settings size={20} /> },
];

export const UNKNOWN_CATEGORY: Categoria = {
    id: 'unknown',
    nome: 'Categoria Desconhecida',
    tipo: TipoCategoria.Saida,
    sistema: true
};

export const CORES_CARTAO = [
  { label: 'Azul', value: '#3b82f6' },
  { label: 'Verde', value: '#22c55e' },
  { label: 'Vermelho', value: '#ef4444' },
  { label: 'Laranja', value: '#f97316' },
  { label: 'Roxo', value: '#a855f7' },
  { label: 'Rosa', value: '#ec4899' },
  { label: 'Amarelo', value: '#eab308' },
  { label: 'Cinza', value: '#6b7280' },
];

export function getCategoryIcon(tipo: TipoCategoria) {
    switch (tipo) {
        case TipoCategoria.Entrada:
            return <div className="w-3 h-3 rounded-full bg-green-500"></div>;
        case TipoCategoria.Saida:
            return <div className="w-3 h-3 rounded-full bg-red-500"></div>;
        case TipoCategoria.Investimento:
            return <div className="w-3 h-3 rounded-full bg-blue-500"></div>;
        case TipoCategoria.Transferencia:
            return <div className="w-3 h-3 rounded-full bg-yellow-500"></div>;
        case TipoCategoria.Estorno:
            return <div className="w-3 h-3 rounded-full bg-purple-500"></div>;
        default:
            return <HelpCircle size={12} className="text-gray-500" />;
    }
}