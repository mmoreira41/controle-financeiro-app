

import React, { useState, useMemo } from 'react';
import { TransacaoBanco, CompraCartao, Categoria, TipoCategoria, ContaBancaria, Cartao, ParcelaCartao, Page, NavigationState } from '../types';
import DatePeriodSelector from '../components/DatePeriodSelector';
import KpiCard from '../components/KpiCard';
import GraficoBarrasESI from '../components/GraficoBarrasESI';
import TransacoesRecentesCard from '../components/TransacoesRecentesCard';
import { formatDate, brMoney } from '../utils/format';

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

const calculateSaldo = (contaId: string, transacoes: TransacaoBanco[]): number => {
    return transacoes
        .filter(t => t.conta_id === contaId && t.realizado)
        .reduce((sum, t) => {
            if (t.tipo === TipoCategoria.Entrada) return sum + t.valor;
            if (t.tipo === TipoCategoria.Saida) return sum - t.valor;
            if (t.tipo === TipoCategoria.Transferencia) {
                if (t.meta_saldo_inicial) return sum + t.valor;
                if (t.meta_pagamento) return sum - t.valor;
                const pair = transacoes.find(p => p.id === t.transferencia_par_id);
                if (pair && t.id < pair.id) return sum - t.valor;
                return sum + t.valor;
            }
            return sum;
        }, 0);
};

export default function ResumoPage({ contas, transacoes, cartoes, compras, parcelas, categorias, setCurrentPage, openModal }: ResumoPageProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const kpis = useMemo(() => {
    const saldoBancario = contas.reduce((sum, c) => sum + calculateSaldo(c.id, transacoes), 0);
    
    const transacoesMes = transacoes.filter(t => t.data.startsWith(selectedMonth) && t.realizado);
    const comprasMes = compras.filter(c => c.data_compra.startsWith(selectedMonth));
    
    const entradas = transacoesMes
        .filter(t => t.tipo === TipoCategoria.Entrada)
        .reduce((sum, t) => sum + t.valor, 0);

    const saidasBanco = transacoesMes
        .filter(t => t.tipo === TipoCategoria.Saida)
        .reduce((sum, t) => sum + t.valor, 0);

    const saidasCartao = comprasMes
        .filter(c => !c.estorno)
        .reduce((sum, c) => sum + c.valor_total, 0);

    const saidas = saidasBanco + saidasCartao;

    const faturaCartao = parcelas
        .filter(p => p.competencia_fatura === selectedMonth)
        .reduce((sum, p) => sum + p.valor_parcela, 0);

    return { saldoBancario, entradas, saidas, faturaCartao };
  }, [selectedMonth, contas, transacoes, compras, parcelas]);
  
  const chartData = useMemo(() => {
      const getMonthOffset = (base: string, offset: number) => {
          const [year, month] = base.split('-').map(Number);
          const d = new Date(year, month -1 + offset, 15);
          return d.toISOString().slice(0, 7);
      };

      const months = [-2, -1, 0, 1, 2].map(offset => getMonthOffset(selectedMonth, offset));
      
      return months.map(m => {
          const transacoesDoMes = transacoes.filter(t => t.data.startsWith(m) && t.realizado);
          const comprasDoMes = compras.filter(c => c.data_compra.startsWith(m) && !c.estorno);

          const entradas = transacoesDoMes.filter(t => t.tipo === TipoCategoria.Entrada).reduce((s, t) => s + t.valor, 0);
          const saidasBanco = transacoesDoMes.filter(t => t.tipo === TipoCategoria.Saida).reduce((s, t) => s + t.valor, 0);
          const saidasCartao = comprasDoMes.reduce((s, c) => s + c.valor_total, 0);
          const investimentos = transacoesDoMes.filter(t => t.tipo === TipoCategoria.Investimento).reduce((s, t) => s + t.valor, 0);

          const d = new Date(`${m}-15T12:00:00Z`);
          const mesLabel = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');
          
          return {
              mes: mesLabel,
              entradas,
              saidas: saidasBanco + saidasCartao,
              investimentos
          };
      });
  }, [selectedMonth, transacoes, compras]);

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
          valor: t.tipo === 'Saida' ? -t.valor : t.valor,
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
          valor: -c.valor_total,
          status,
          statusType,
          kind: 'CARTAO' as const,
          sourceId: c.cartao_id,
          type: 'compra' as const,
          original: c,
        };
      });

    return [...bankTx, ...cardTx]
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 5);
  }, [selectedMonth, transacoes, compras, parcelas, categorias, contas, cartoes]);
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-center">
        <DatePeriodSelector
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Saldo Bancário" value={kpis.saldoBancario} icon="bank" onClick={() => setCurrentPage('contas-extrato')} />
        <KpiCard label="Entradas (mês)" value={kpis.entradas} icon="up" onClick={() => setCurrentPage('contas-extrato', { month: selectedMonth, filters: { tipoFiltro: TipoCategoria.Entrada } })} />
        <KpiCard label="Saídas (mês)" value={kpis.saidas} icon="down" onClick={() => setCurrentPage('contas-extrato', { month: selectedMonth, filters: { tipoFiltro: TipoCategoria.Saida } })} />
        <KpiCard label="Cartão de Crédito (fatura)" value={kpis.faturaCartao} icon="card" onClick={() => setCurrentPage('cartoes', { month: selectedMonth })} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          <GraficoBarrasESI data={chartData} />
        </div>
        <div className="xl:col-span-1">
          <TransacoesRecentesCard items={recentTransactions} setCurrentPage={setCurrentPage} openModal={openModal} />
        </div>
      </div>
    </div>
  );
}