import React, { useState, useMemo } from 'react';
import { ContaBancaria, TransacaoBanco, TipoCategoria, Categoria, Cartao, CompraCartao, ParcelaCartao } from '../types';
import PageHeader from '../components/PageHeader';
import { formatCurrency, formatDate } from '../utils/format';
import { Download } from 'lucide-react';
import DatePeriodSelector from '../components/DatePeriodSelector';

interface FluxoCaixaPageProps {
  contas: ContaBancaria[];
  transacoes: TransacaoBanco[];
  categorias: Categoria[];
  cartoes: Cartao[];
  compras: CompraCartao[];
  parcelas: ParcelaCartao[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

const FluxoCaixaPage: React.FC<FluxoCaixaPageProps> = ({ contas, transacoes, categorias, cartoes, compras, parcelas, selectedMonth, onMonthChange }) => {
  const [incluirParcelas, setIncluirParcelas] = useState(false);

  const fluxoData = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const startDate = `${selectedMonth}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
  
    const contasAtivasIds = new Set(contas.filter(c => c.ativo).map(c => c.id));
  
    let saldoInicialPeriodo = 0;
    transacoes
      .filter(t => t.realizado && t.data < startDate && contasAtivasIds.has(t.conta_id))
      .forEach(t => {
        if (t.tipo === TipoCategoria.Entrada) saldoInicialPeriodo += t.valor;
        else if (t.tipo === TipoCategoria.Saida || t.tipo === TipoCategoria.Investimento) saldoInicialPeriodo -= t.valor;
        else if (t.tipo === TipoCategoria.Transferencia) {
            if (t.meta_saldo_inicial) saldoInicialPeriodo += t.valor;
            else if (t.meta_pagamento) saldoInicialPeriodo -= t.valor;
            else {
                 const pair = transacoes.find(p => p.id === t.transferencia_par_id);
                 if (pair && t.id < pair.id) saldoInicialPeriodo -= t.valor;
                 else saldoInicialPeriodo += t.valor;
            }
        }
      });
  
    const dailyAggregates: Record<string, { entradas: number; saidas: number; pagamentos: number; cartaoCompetencia: number }> = {};
    
    transacoes
      .filter(t => t.realizado && t.data >= startDate && t.data <= endDate && contasAtivasIds.has(t.conta_id))
      .forEach(t => {
        if (!dailyAggregates[t.data]) {
          dailyAggregates[t.data] = { entradas: 0, saidas: 0, pagamentos: 0, cartaoCompetencia: 0 };
        }
        
        if (t.tipo === TipoCategoria.Entrada) {
             dailyAggregates[t.data].entradas += t.valor;
        } else if (t.tipo === TipoCategoria.Saida || t.tipo === TipoCategoria.Investimento) {
            dailyAggregates[t.data].saidas += t.valor;
        } else if (t.tipo === TipoCategoria.Transferencia && t.meta_pagamento) {
            dailyAggregates[t.data].pagamentos += t.valor;
        }
      });
      
    if (incluirParcelas) {
      const comprasMap = new Map(compras.map(c => [c.id, c]));
      const cartaoVencimentoMap = new Map(cartoes.map(c => [c.id, c.dia_vencimento]));

      parcelas.forEach(p => {
        const compra = comprasMap.get(p.compra_id);
        if (!compra) return;
        const vencimentoDia = cartaoVencimentoMap.get(compra.cartao_id);
        if (!vencimentoDia) return;

        const [year, month] = p.competencia_fatura.split('-').map(Number);
        const vencimentoDate = new Date(Date.UTC(year, month - 1, vencimentoDia));
        const vencimentoDateStr = vencimentoDate.toISOString().split('T')[0];

        if (vencimentoDateStr >= startDate && vencimentoDateStr <= endDate) {
            if (!dailyAggregates[vencimentoDateStr]) {
                dailyAggregates[vencimentoDateStr] = { entradas: 0, saidas: 0, pagamentos: 0, cartaoCompetencia: 0 };
            }
            dailyAggregates[vencimentoDateStr].cartaoCompetencia += p.valor_parcela;
        }
      });
    }
  
    const result = [];
    let saldoDiaAnterior = saldoInicialPeriodo;
    const current = new Date(`${startDate}T00:00:00`);
    const last = new Date(`${endDate}T00:00:00`);
  
    while (current <= last) {
      const dayStr = current.toISOString().split('T')[0];
      const daily = dailyAggregates[dayStr] || { entradas: 0, saidas: 0, pagamentos: 0, cartaoCompetencia: 0 };
      
      const saldoFinal = saldoDiaAnterior + daily.entradas - daily.saidas - daily.pagamentos;
      
      result.push({
        data: dayStr,
        ...daily,
        saldoFinal
      });
      
      saldoDiaAnterior = saldoFinal;
      current.setDate(current.getDate() + 1);
    }
  
    return result.sort((a,b) => a.data.localeCompare(b.data));
  }, [contas, transacoes, cartoes, compras, parcelas, selectedMonth, incluirParcelas]);

  return (
    <div className="animate-fade-in">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Fluxo de Caixa</h2>
      </div>
      <div className="flex justify-center mb-6">
        <DatePeriodSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} />
      </div>

      <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Movimento Diário das Contas</h3>
            <div className="flex items-center space-x-3">
                <label htmlFor="toggle-parcelas" className="text-sm font-medium text-gray-300 whitespace-nowrap">Incluir Faturas (Competência)</label>
                <button
                  id="toggle-parcelas"
                  onClick={() => setIncluirParcelas(!incluirParcelas)}
                  className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${incluirParcelas ? 'bg-green-500' : 'bg-gray-600'}`}
                >
                  <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${incluirParcelas ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="p-4 font-semibold text-sm">Data</th>
                <th className="p-4 font-semibold text-sm text-right">Entradas</th>
                <th className="p-4 font-semibold text-sm text-right">Saídas</th>
                <th className="p-4 font-semibold text-sm text-right">Pag. Fatura</th>
                {incluirParcelas && <th className="p-4 font-semibold text-sm text-right">Faturas (competência)</th>}
                <th className="p-4 font-semibold text-sm text-right">Saldo Final</th>
              </tr>
            </thead>
            <tbody>
              {fluxoData.map((dia) => (
                <tr key={dia.data} className="border-t border-gray-700 hover:bg-gray-700/50">
                  <td className="p-4">{formatDate(dia.data)}</td>
                  <td className={`p-4 text-right ${dia.entradas > 0 ? 'text-green-500' : 'text-gray-400'}`}>{formatCurrency(dia.entradas)}</td>
                  <td className={`p-4 text-right ${dia.saidas > 0 ? 'text-red-500' : 'text-gray-400'}`}>{formatCurrency(dia.saidas)}</td>
                  <td className={`p-4 text-right ${dia.pagamentos > 0 ? 'text-yellow-500' : 'text-gray-400'}`}>{formatCurrency(dia.pagamentos)}</td>
                  {incluirParcelas && <td className={`p-4 text-right ${dia.cartaoCompetencia > 0 ? 'text-purple-400' : 'text-gray-400'}`}>{formatCurrency(dia.cartaoCompetencia)}</td>}
                  <td className="p-4 font-bold text-right">{formatCurrency(dia.saldoFinal)}</td>
                </tr>
              ))}
              {fluxoData.length === 0 && (
                <tr className="border-t border-gray-700">
                  <td colSpan={incluirParcelas ? 6 : 5} className="text-center text-gray-400 py-8">
                    Nenhum dado para o período selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FluxoCaixaPage;