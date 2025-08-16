import React, { useMemo, useCallback } from 'react';
import { TransacaoBanco, Categoria, TipoCategoria, ContaBancaria, Cartao, CompraCartao, ParcelaCartao, Page, NavigationState } from '../types';
import { calculateSaldo, formatCurrency } from '../utils/format';
import { Page as PageType } from '../types';
import SummaryCard from '../components/SummaryCard';
import TransacoesRecentesCard from '../components/TransacoesRecentesCard';
import ChartContainer from '../components/ChartContainer';
import { ArrowUp, ArrowDown, CreditCard, PiggyBank } from 'lucide-react';

interface ResumoPageProps {
  contas: ContaBancaria[];
  transacoes: TransacaoBanco[];
  cartoes: Cartao[];
  compras: CompraCartao[];
  parcelas: ParcelaCartao[];
  categorias: Categoria[];
  setCurrentPage: (page: PageType, state?: NavigationState | null) => void;
  openModal: (modal: string, data?: any) => void;
}

export default function ResumoPage({ contas, transacoes, cartoes, compras, parcelas, categorias, setCurrentPage, openModal }: ResumoPageProps) {
  const selectedMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const getMonthData = useCallback((month: string) => {
    const transacoesRealizadasMes = transacoes.filter(t => t.data.startsWith(month) && t.realizado);
    const entradas = transacoesRealizadasMes.filter(t => t.tipo === TipoCategoria.Entrada).reduce((sum, t) => sum + t.valor, 0);
    const saidasBanco = transacoesRealizadasMes.filter(t => t.tipo === TipoCategoria.Saida).reduce((sum, t) => sum + t.valor, 0);
    const investimentosMes = transacoesRealizadasMes.filter(t => t.tipo === TipoCategoria.Investimento).reduce((sum, t) => sum + t.valor, 0);
    
    const parcelasMes = parcelas.filter(p => p.competencia_fatura === month);
    const comprasNoCartao = parcelasMes
        .filter(p => {
            const compra = compras.find(c => c.id === p.compra_id && !c.estorno);
            return !!compra;
        })
        .reduce((sum, p) => sum + p.valor_parcela, 0);
        
    const faturaCartao = parcelasMes.reduce((sum, p) => sum + p.valor_parcela, 0);
    
    const allInvestmentsUntilMonthEnd = transacoes.filter(t => 
        t.tipo === TipoCategoria.Investimento && 
        t.realizado && 
        t.data <= `${month}-31`
    );
    const totalInvestido = allInvestmentsUntilMonthEnd.reduce((sum, t) => sum + t.valor, 0);
    
    return { entradas, saidas: saidasBanco + comprasNoCartao, faturaCartao, totalInvestido, investimentos: investimentosMes };
  }, [transacoes, parcelas, compras]);

  const { currentMonthData, previousMonthData, saldoBancario, saldoProjetado, projectionDateString } = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const previousMonthDate = new Date(year, month - 2, 15);
    const previousMonthStr = previousMonthDate.toISOString().slice(0, 7);
    
    const saldoAtual = contas.reduce((sum, c) => sum + calculateSaldo(c.id, transacoes), 0);

    const transacoesFuturas = transacoes.filter(t => t.data > today && t.data.startsWith(selectedMonth) && !t.realizado);
    const valorFuturo = transacoesFuturas.reduce((sum, t) => {
        if (t.tipo === TipoCategoria.Entrada) return sum + t.valor;
        if (t.tipo === TipoCategoria.Saida || t.tipo === TipoCategoria.Investimento) return sum - t.valor;
        if (t.meta_pagamento) return sum - t.valor;
        return sum;
    }, 0);

    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const monthName = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long' });
    const dateString = ` - ${lastDayOfMonth} de ${monthName}`;

    return {
      currentMonthData: getMonthData(selectedMonth),
      previousMonthData: getMonthData(previousMonthStr),
      saldoBancario: saldoAtual,
      saldoProjetado: saldoAtual + valorFuturo,
      projectionDateString: dateString,
    };
  }, [selectedMonth, contas, transacoes, today, getMonthData]);

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const recentTransactions = useMemo(() => {
    const categoriaMap = new Map(categorias.map(c => [c.id, c]));
    const contaMap = new Map(contas.map(c => [c.id, c]));
    const cartaoMap = new Map(cartoes.map(c => [c.id, c]));

    const allTransactions = transacoes
      .filter(t => t.realizado)
      .map(t => ({ t, date: new Date(t.data) }));

    const allCompras = compras
      .map(c => ({ c, date: new Date(c.data_compra) }));
    
    const combined = [
        ...allTransactions.map(({t}) => {
            const statusType: 'success' | 'danger' | 'info' = t.tipo === TipoCategoria.Entrada ? 'success' : t.tipo === TipoCategoria.Saida || t.tipo === TipoCategoria.Investimento ? 'danger' : 'info';
            return {
              id: t.id,
              data: t.data,
              titulo: t.descricao,
              subtitulo: `${contaMap.get(t.conta_id)?.nome || ''} • ${categoriaMap.get(t.categoria_id)?.nome || ''}`,
              valor: t.tipo === 'Saida' || t.tipo === 'Investimento' ? -t.valor : t.valor,
              statusType: statusType,
              kind: 'BANCO' as const,
              sourceId: t.conta_id,
              type: 'transacao' as const,
              original: t,
            };
        }),
        ...allCompras.map(({c}) => {
            return {
              id: c.id,
              data: c.data_compra,
              titulo: c.descricao,
              subtitulo: `${cartaoMap.get(c.cartao_id)?.apelido || ''} • ${categoriaMap.get(c.categoria_id)?.nome || ''}`,
              valor: c.estorno ? c.valor_total : -c.valor_total,
              statusType: (c.estorno ? 'info' : 'warning') as 'info' | 'warning',
              kind: 'CARTAO' as const,
              sourceId: c.cartao_id,
              type: 'compra' as const,
              original: c,
            };
        })
    ].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 5);

    return combined;
  }, [transacoes, compras, categorias, contas, cartoes]);

  const despesasPorCategoria = useMemo(() => {
    const gastos: Record<string, number> = {};
    const categoriaMap = new Map(categorias.map(c => [c.id, c.nome]));

    transacoes
      .filter(t => t.realizado && t.tipo === TipoCategoria.Saida && t.data.startsWith(selectedMonth))
      .forEach(t => {
        const nomeCat = categoriaMap.get(t.categoria_id) || 'Desconhecido';
        gastos[nomeCat] = (gastos[nomeCat] || 0) + t.valor;
      });

    parcelas
      .filter(p => p.competencia_fatura === selectedMonth)
      .forEach(p => {
        const compra = compras.find(c => c.id === p.compra_id && !c.estorno);
        if (compra) {
          const nomeCat = categoriaMap.get(compra.categoria_id) || 'Desconhecido';
          gastos[nomeCat] = (gastos[nomeCat] || 0) + p.valor_parcela;
        }
      });
      
    return Object.entries(gastos).map(([categoria, valor]) => ({ categoria, valor }));
  }, [transacoes, compras, parcelas, categorias, selectedMonth]);

  const historicoMensal = useMemo(() => {
    const data = [];
    const date = new Date(`${selectedMonth}-15T12:00:00Z`);
    for (let i = 4; i >= 0; i--) {
      const targetDate = new Date(date);
      targetDate.setUTCMonth(targetDate.getUTCMonth() - i);
      const monthStr = targetDate.toISOString().slice(0, 7);
      const monthData = getMonthData(monthStr);
      data.push({
        mes: targetDate.toLocaleDateString('pt-BR', { month: 'short' }),
        entradas: monthData.entradas,
        saidas: monthData.saidas,
        investimentos: monthData.investimentos,
      });
    }
    return data;
  }, [selectedMonth, getMonthData]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-gray-800 rounded-2xl p-6 text-center">
        <p className="text-gray-400 text-sm">Saldo Total Consolidado</p>
        <p className="text-4xl font-bold text-white mt-1">{formatCurrency(saldoBancario)}</p>
        <div className="mt-2 text-sm bg-gray-700/50 inline-block px-3 py-1 rounded-full">
            <span className="text-gray-400">Saldo projetado: </span>
            <span className="font-semibold text-white">{formatCurrency(saldoProjetado)}</span>
            <span className="text-gray-400">{projectionDateString}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SummaryCard 
          title="Entradas do Mês"
          value={currentMonthData.entradas}
          change={calculateChange(currentMonthData.entradas, previousMonthData.entradas)}
          icon={<ArrowUp size={18} className="text-green-400" />}
        />
        <SummaryCard 
          title="Saídas do Mês"
          value={currentMonthData.saidas}
          change={calculateChange(currentMonthData.saidas, previousMonthData.saidas)}
          icon={<ArrowDown size={18} className="text-red-400" />}
        />
        <SummaryCard 
          title="Fatura do Cartão"
          value={currentMonthData.faturaCartao}
          change={calculateChange(currentMonthData.faturaCartao, previousMonthData.faturaCartao)}
          icon={<CreditCard size={18} className="text-purple-400" />}
          onClick={() => setCurrentPage('cartoes')}
        />
        <SummaryCard 
          title="Total Investido"
          value={currentMonthData.totalInvestido}
          change={calculateChange(currentMonthData.totalInvestido, previousMonthData.totalInvestido)}
          icon={<PiggyBank size={18} className="text-blue-400" />}
          onClick={() => setCurrentPage('investimentos')}
        />
      </div>

      <TransacoesRecentesCard 
        items={recentTransactions} 
        setCurrentPage={setCurrentPage} 
        openModal={openModal} 
      />
      
      <ChartContainer 
        despesasData={despesasPorCategoria}
        evolucaoData={historicoMensal}
      />
    </div>
  );
}