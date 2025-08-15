

import React, { useState, useMemo } from 'react';

import DatePeriodSelector from '../components/DatePeriodSelector';
import KPICard from '../components/KPICard';
import GraficoBarrasESI from '../components/GraficoBarrasESI';
import TransacoesRecentesCard from '../components/TransacoesRecentesCard';
import DoughnutChart from '../components/DoughnutChart';
import PatrimonioLiquidoChart from '../components/PatrimonioLiquidoChart';
import { TransacaoBanco, CompraCartao, Categoria, TipoCategoria, ContaBancaria, Cartao, ParcelaCartao, Page, NavigationState } from '../types';
import { formatDate, calculateSaldo } from '../utils/format';

type ActiveChart = 'fluxo' | 'despesas' | 'patrimonio';

interface ResumoPageProps {
  contas: ContaBancaria[];
  transacoes: TransacaoBanco[];
  cartoes: Cartao[];
  compras: CompraCartao[];
  parcelas: ParcelaCartao[];
  categorias: Categoria[];
  setCurrentPage: (page: Page, state?: NavigationState | null) => void;
  openModal: (modal: string, data?: any) => void;
}

export default function ResumoPage({ contas, transacoes, cartoes, compras, parcelas, categorias, setCurrentPage, openModal }: ResumoPageProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [activeChart, setActiveChart] = useState<ActiveChart>('fluxo');

  const kpis = useMemo(() => {
    const saldoBancario = contas.reduce((sum, c) => sum + calculateSaldo(c.id, transacoes), 0);
    const transacoesRealizadasMes = transacoes.filter(t => t.data.startsWith(selectedMonth) && t.realizado);
    const entradas = transacoesRealizadasMes.filter(t => t.tipo === TipoCategoria.Entrada).reduce((sum, t) => sum + t.valor, 0);
    const saidasBanco = transacoesRealizadasMes.filter(t => t.tipo === TipoCategoria.Saida || t.tipo === TipoCategoria.Investimento).reduce((sum, t) => sum + t.valor, 0);
    const parcelasMes = parcelas.filter(p => p.competencia_fatura === selectedMonth);
    const faturaCartao = parcelasMes.reduce((sum, p) => sum + p.valor_parcela, 0);
    const saidas = saidasBanco + faturaCartao;
    
    const [year, month] = selectedMonth.split('-').map(Number);
    const dataAnterior = new Date(year, month - 1, 0).toISOString().split('T')[0];
    const saldoInicioDoMes = contas.reduce((sum, c) => sum + calculateSaldo(c.id, transacoes, dataAnterior), 0);
    const transacoesTodoMes = transacoes.filter(t => t.data.startsWith(selectedMonth));
    const entradasProjetadas = transacoesTodoMes.filter(t => t.tipo === TipoCategoria.Entrada || (t.tipo === TipoCategoria.Transferencia && t.meta_saldo_inicial)).reduce((s, t) => s + t.valor, 0);
    const saidasProjetadas = transacoesTodoMes.filter(t => t.tipo === TipoCategoria.Saida || t.tipo === TipoCategoria.Investimento || (t.tipo === TipoCategoria.Transferencia && t.meta_pagamento)).reduce((s, t) => s + t.valor, 0);
    const saldoProjetado = saldoInicioDoMes + entradasProjetadas - saidasProjetadas - faturaCartao; // Also subtract credit card bill

    const mesProjecaoLabel = new Date(`${selectedMonth}-15T12:00:00Z`).toLocaleDateString('pt-BR', { month: 'long' });

    return { saldoBancario, entradas, saidas, faturaCartao, saldoProjetado, mesProjecaoLabel };
  }, [selectedMonth, contas, transacoes, parcelas]);
  
  const chartData = useMemo(() => {
      const getMonthOffset = (base: string, offset: number) => {
          const [year, month] = base.split('-').map(Number);
          const d = new Date(year, month -1 + offset, 15);
          return d.toISOString().slice(0, 7);
      };
      const months = [-2, -1, 0, 1, 2].map(offset => getMonthOffset(selectedMonth, offset));
      return months.map(m => {
          const transacoesDoMes = transacoes.filter(t => t.data.startsWith(m) && t.realizado);
          const parcelasDoMes = parcelas.filter(p => p.competencia_fatura === m);
          const entradas = transacoesDoMes.filter(t => t.tipo === TipoCategoria.Entrada).reduce((s, t) => s + t.valor, 0);
          const saidasBanco = transacoesDoMes.filter(t => t.tipo === TipoCategoria.Saida).reduce((s, t) => s + t.valor, 0);
          const saidasCartao = parcelasDoMes.reduce((s, p) => s + p.valor_parcela, 0);
          const investimentos = transacoesDoMes.filter(t => t.tipo === TipoCategoria.Investimento).reduce((s, t) => s + t.valor, 0);
          const d = new Date(`${m}-15T12:00:00Z`);
          const mesLabel = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');
          return { mes: mesLabel, entradas, saidas: saidasBanco + saidasCartao, investimentos };
      });
  }, [selectedMonth, transacoes, parcelas]);

    const despesasDonutData = useMemo(() => {
        const categoriaMap = new Map(categorias.map(c => [c.id, c.nome]));
        const gastos: Record<string, number> = {};
        transacoes.filter(t => t.data.startsWith(selectedMonth) && t.realizado && t.tipo === TipoCategoria.Saida)
            .forEach(t => {
                const nomeCat = categoriaMap.get(t.categoria_id) || 'Outros';
                gastos[nomeCat] = (gastos[nomeCat] || 0) + t.valor;
            });
        parcelas.filter(p => p.competencia_fatura === selectedMonth)
            .forEach(p => {
                const compra = compras.find(c => c.id === p.compra_id && !c.estorno);
                if (compra) {
                    const nomeCat = categoriaMap.get(compra.categoria_id) || 'Outros';
                    gastos[nomeCat] = (gastos[nomeCat] || 0) + p.valor_parcela;
                }
            });
        return Object.entries(gastos).map(([categoria, valor]) => ({ categoria, valor }));
    }, [selectedMonth, transacoes, parcelas, compras, categorias]);
    
    const patrimonioLineData = useMemo(() => {
        const data = [];
        const today = new Date();
        for (let i = 11; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const endDateOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
            const mesLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');
            const patrimonio = contas.reduce((sum, conta) => sum + calculateSaldo(conta.id, transacoes, endDateOfMonth), 0);
            data.push({ mes: mesLabel, patrimonio });
        }
        return data;
    }, [contas, transacoes]);

  const recentTransactions = useMemo(() => {
    const pagamentosFatura = transacoes.filter(t => t.meta_pagamento);
    const categoriaMap = new Map(categorias.map(c => [c.id, c]));
    const contaMap = new Map(contas.map(c => [c.id, c]));
    const cartaoMap = new Map(cartoes.map(c => [c.id, c]));

    const bankTx = transacoes
      .filter(t => t.data.startsWith(selectedMonth) && t.tipo !== TipoCategoria.Transferencia && !t.meta_pagamento && !t.meta_saldo_inicial)
      .map(t => {
        const statusType: 'success' | 'danger' | 'info' = t.tipo === TipoCategoria.Entrada ? 'success' : t.tipo === TipoCategoria.Saida ? 'danger' : 'info';
        return {
          id: t.id,
          data: t.data,
          titulo: t.tipo === 'Saida' ? 'Saída' : t.tipo,
          subtitulo: `${contaMap.get(t.conta_id)?.nome || ''} • ${categoriaMap.get(t.categoria_id)?.nome || ''} • ${formatDate(t.data)}`,
          valor: t.tipo === 'Saida' || t.tipo === 'Investimento' ? -t.valor : t.valor,
          statusType: statusType,
          kind: 'BANCO' as const,
          sourceId: t.conta_id,
          type: 'transacao' as const,
          original: t,
        };
    });

    const cardTx = compras
      .filter(c => c.data_compra.startsWith(selectedMonth))
      .map(c => {
        const parcelasDaCompra = parcelas.filter(p => p.compra_id === c.id);
        const parcelasPagas = parcelasDaCompra.filter(p => pagamentosFatura.some(pag => pag.cartao_id === c.cartao_id && pag.competencia_fatura === p.competencia_fatura)).length;
        
        let status = 'Pendente';
        let statusType: 'success' | 'warning' | 'info' = 'warning';
        if (c.estorno) {
            status = 'Estorno';
            statusType = 'info';
        } else if (c.parcelas_total > 1) {
            status = `Parcelado ${parcelasPagas}/${c.parcelas_total}`;
            statusType = 'info';
        } else {
            const faturaCompetencia = parcelasDaCompra[0]?.competencia_fatura;
            if (faturaCompetencia && pagamentosFatura.some(p => p.cartao_id === c.cartao_id && p.competencia_fatura === faturaCompetencia)) {
                status = 'Pago';
                statusType = 'success';
            }
        }

        return {
          id: c.id,
          data: c.data_compra,
          titulo: 'Cartão de crédito',
          subtitulo: `${cartaoMap.get(c.cartao_id)?.apelido || ''} • ${categoriaMap.get(c.categoria_id)?.nome || ''} • ${formatDate(c.data_compra)}`,
          valor: c.estorno ? c.valor_total : -c.valor_total,
          status,
          statusType,
          kind: 'CARTAO' as const,
          sourceId: c.cartao_id,
          type: 'compra' as const,
          original: c,
        };
    });

    return [...bankTx, ...cardTx].sort((a, b) => b.data.localeCompare(a.data));
  }, [selectedMonth, transacoes, compras, parcelas, categorias, contas, cartoes]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Resumo Mensal</h2>
        <div className="flex justify-center">
          <DatePeriodSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          label="Saldo Bancário"
          value={kpis.saldoBancario}
          icon="bank"
          projectedValue={kpis.saldoProjetado}
          projectedLabel={`Projetado (${kpis.mesProjecaoLabel})`}
        />
        <KPICard label="Entradas do Mês" value={kpis.entradas} icon="up" />
        <KPICard label="Saídas do Mês" value={kpis.saidas} icon="down" />
        <KPICard label="Fatura do Cartão" value={kpis.faturaCartao} icon="card" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-4 rounded-2xl">
          <div className="flex items-center space-x-2 border-b border-gray-700 mb-4 pb-2">
            <button onClick={() => setActiveChart('fluxo')} className={`px-3 py-1 rounded-md text-sm ${activeChart === 'fluxo' ? 'bg-green-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Fluxo Mensal</button>
            <button onClick={() => setActiveChart('despesas')} className={`px-3 py-1 rounded-md text-sm ${activeChart === 'despesas' ? 'bg-green-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Despesas</button>
            <button onClick={() => setActiveChart('patrimonio')} className={`px-3 py-1 rounded-md text-sm ${activeChart === 'patrimonio' ? 'bg-green-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Patrimônio</button>
          </div>
          {activeChart === 'fluxo' && <GraficoBarrasESI data={chartData} />}
          {activeChart === 'despesas' && <DoughnutChart rows={despesasDonutData} />}
          {activeChart === 'patrimonio' && <PatrimonioLiquidoChart data={patrimonioLineData} />}
        </div>

        <TransacoesRecentesCard 
          items={recentTransactions} 
          setCurrentPage={setCurrentPage} 
          openModal={openModal} 
        />
      </div>
    </div>
  );
}