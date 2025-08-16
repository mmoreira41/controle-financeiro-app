import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ContaBancaria, TransacaoBanco, TipoCategoria, Categoria, CompraCartao, ParcelaCartao } from '../types';
import { formatCurrency, formatDate, splitInstallments, calculateSaldo } from '../utils/format';
import { AlertTriangle, X, Trash2, Pencil, Plus } from 'lucide-react';
import DatePeriodSelector from '../components/DatePeriodSelector';
import Modal from '../components/Modal';
import CurrencyInput from '../components/CurrencyInput';

interface FluxoCaixaPageProps {
  contas: ContaBancaria[];
  transacoes: TransacaoBanco[];
  categorias: Categoria[];
  compras: CompraCartao[];
  parcelas: ParcelaCartao[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

const FluxoCaixaPage: React.FC<FluxoCaixaPageProps> = ({ contas, transacoes, categorias, compras, parcelas, selectedMonth, onMonthChange }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationTransactions, setSimulationTransactions] = useState<TransacaoBanco[]>([]);
  const [manageSimModalState, setManageSimModalState] = useState<{ date: string; type: TipoCategoria } | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number, y: number, dayData: DayData } | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  const exitSimulation = () => {
    setIsSimulating(false);
    setSimulationTransactions([]);
    setManageSimModalState(null);
  };
  
  useEffect(() => {
    return () => {
      exitSimulation();
    };
  }, []);

  const { fluxoData, minSaldo, maxSaldo, totais } = useMemo(() => {
    const allBankTransactions = [...transacoes, ...simulationTransactions];
    const [year, month] = selectedMonth.split('-').map(Number);
    const startDate = `${selectedMonth}-01`;
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const endDate = `${selectedMonth}-${lastDayOfMonth}`;

    const firstDayOfMonth = new Date(year, month - 1, 1);
    const previousDay = new Date(firstDayOfMonth);
    previousDay.setDate(firstDayOfMonth.getDate() - 1);
    const previousDayStr = previousDay.toISOString().split('T')[0];
    
    const contasAtivas = contas.filter(c => c.ativo);
    const contasAtivasIds = new Set(contasAtivas.map(c => c.id));

    const saldoInicialPeriodo = contasAtivas.reduce((total, conta) => {
        return total + calculateSaldo(conta.id, transacoes, previousDayStr);
    }, 0);

    const dailyAggregates: Record<string, { entradas: number; saidas: number; investimentos: number; transactions: TransacaoBanco[] }> = {};
    
    allBankTransactions
      .filter(t => t.data >= startDate && t.data <= endDate && contasAtivasIds.has(t.conta_id))
      .filter(t => !t.meta_pagamento) // Ignore credit card payments
      .forEach(t => {
        // Ignore internal transfers for consolidated view
        if (t.tipo === TipoCategoria.Transferencia && t.transferencia_par_id) {
          return;
        }

        if (!dailyAggregates[t.data]) {
          dailyAggregates[t.data] = { entradas: 0, saidas: 0, investimentos: 0, transactions: [] };
        }
        
        if (t.tipo === TipoCategoria.Entrada) dailyAggregates[t.data].entradas += t.valor;
        else if (t.tipo === TipoCategoria.Saida) dailyAggregates[t.data].saidas += t.valor;
        else if (t.tipo === TipoCategoria.Investimento) dailyAggregates[t.data].investimentos += t.valor;
        
        dailyAggregates[t.data].transactions.push(t);
      });
      
    parcelas.forEach(p => {
      const compra = compras.find(c => c.id === p.compra_id);
      // Only include purchases made within the selected month
      if (!compra || compra.data_compra < startDate || compra.data_compra > endDate) {
        return;
      }
      
      const dayStr = compra.data_compra;
      if (!dailyAggregates[dayStr]) {
        dailyAggregates[dayStr] = { entradas: 0, saidas: 0, investimentos: 0, transactions: [] };
      }

      if (compra.estorno) {
        dailyAggregates[dayStr].entradas += p.valor_parcela;
      } else {
        dailyAggregates[dayStr].saidas += p.valor_parcela;
      }

      // Create a pseudo-transaction for the tooltip
      const pseudoTx: TransacaoBanco = {
          id: `cc-${p.id}`,
          conta_id: 'credit-card',
          data: dayStr,
          valor: p.valor_parcela,
          categoria_id: compra.categoria_id,
          tipo: compra.estorno ? TipoCategoria.Entrada : TipoCategoria.Saida,
          descricao: `${compra.descricao} (CC ${p.n_parcela}/${compra.parcelas_total})`,
          previsto: false,
          realizado: true,
      };
      dailyAggregates[dayStr].transactions.push(pseudoTx);
    });
  
    const result: DayData[] = [];
    let saldoDiaAnterior = saldoInicialPeriodo;
    const current = new Date(`${startDate}T12:00:00Z`);
    const last = new Date(`${endDate}T12:00:00Z`);
  
    while (current <= last) {
      const dayStr = current.toISOString().split('T')[0];
      const daily = dailyAggregates[dayStr] || { entradas: 0, saidas: 0, investimentos: 0, transactions: [] };
      
      daily.transactions.sort((a,b) => a.descricao.localeCompare(b.descricao));
      
      const saldoDiario = saldoDiaAnterior + daily.entradas - daily.saidas - daily.investimentos;
      
      result.push({
        data: dayStr,
        ...daily,
        saldoDiario
      });
      
      saldoDiaAnterior = saldoDiario;
      current.setUTCDate(current.getUTCDate() + 1);
    }
    
    const saldos = result.map(d => d.saldoDiario);
    const min = Math.min(0, ...saldos);
    const max = Math.max(0, ...saldos);
    
    const totais = result.reduce((acc, day) => ({
        entradas: acc.entradas + day.entradas,
        saidas: acc.saidas + day.saidas,
        investimentos: acc.investimentos + day.investimentos,
    }), { entradas: 0, saidas: 0, investimentos: 0 });

    return { fluxoData: result, minSaldo: min, maxSaldo: max, totais };
  }, [contas, transacoes, selectedMonth, simulationTransactions, compras, parcelas]);

  const getSaldoCellStyle = (saldo: number): React.CSSProperties => {
    if (maxSaldo === minSaldo || saldo === 0) return { backgroundColor: 'transparent' };
    
    let normalizedValue = 0;
    if (saldo > 0) {
        normalizedValue = maxSaldo > 0 ? saldo / maxSaldo : 1;
    } else { 
        normalizedValue = minSaldo < 0 ? saldo / minSaldo : 1; 
    }
    
    const opacity = Math.min(0.8, 0.1 + Math.pow(Math.abs(normalizedValue), 0.7) * 0.7);

    if (saldo > 0) {
        return { backgroundColor: `rgba(34, 197, 94, ${opacity})` };
    } else if (saldo < 0) {
        return { backgroundColor: `rgba(239, 68, 68, ${opacity})` };
    }
    return { backgroundColor: 'transparent' };
  };

  const handleCellClick = (date: string, type: TipoCategoria) => {
    setIsSimulating(true);
    setManageSimModalState({ date, type });
  };
  
  const handleAddSimulations = (txs: TransacaoBanco[]) => {
      setSimulationTransactions(prev => [...prev, ...txs]);
  };

  const handleUpdateSimulation = (updatedTx: TransacaoBanco) => {
      setSimulationTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
  };
  
  const handleDeleteSimulation = (txId: string) => {
      setSimulationTransactions(prev => {
        const updated = prev.filter(t => t.id !== txId);
        if (updated.length === 0) {
            // If the last simulation is deleted, exit simulation mode
            exitSimulation();
        }
        return updated;
      });
  };

  const handleMouseMove = (e: React.MouseEvent, dayData: DayData) => {
    if (dayData.transactions.length === 0) {
      setTooltip(null);
      return;
    }
    if(tableContainerRef.current) {
        const rect = tableContainerRef.current.getBoundingClientRect();
        setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, dayData });
    }
  };

  return (
    <div className="animate-fade-in flex flex-col h-full">
      {isSimulating && (
          <div 
            onClick={exitSimulation}
            className="cursor-pointer mb-4 bg-blue-900/50 border border-blue-700 rounded-lg p-3 flex justify-between items-center animate-fade-in-down hover:bg-blue-900/80 transition-colors"
            role="button"
            tabIndex={0}
            aria-label="Sair do modo de simulação"
          >
              <div className="flex items-center space-x-3">
                  <AlertTriangle className="text-blue-400" />
                  <div>
                      <span className="font-semibold text-white">Modo de Simulação Ativo</span>
                      <p className="text-xs text-blue-300">Todas as alterações são temporárias. Clique aqui para sair e descartar.</p>
                  </div>
              </div>
              <X size={20} className="text-blue-300 flex-shrink-0 ml-2"/>
          </div>
      )}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Fluxo de Caixa</h2>
      </div>
      <div className="flex justify-center mb-6">
        <DatePeriodSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} />
      </div>

      <div ref={tableContainerRef} className="bg-gray-800 rounded-lg shadow-md overflow-auto flex-grow relative">
        <table className="w-full text-left min-w-[600px]">
          <thead className="bg-gray-700/50 sticky top-0 z-10">
            <tr>
              <th className="p-4 font-semibold text-sm">Data</th>
              <th className="p-4 font-semibold text-sm text-right">Entradas</th>
              <th className="p-4 font-semibold text-sm text-right">Saídas</th>
              <th className="p-4 font-semibold text-sm text-right">Investimentos</th>
              <th className="p-4 font-semibold text-sm text-right">Saldo Diário</th>
            </tr>
          </thead>
          <tbody onMouseLeave={() => setTooltip(null)}>
            {fluxoData.map((dia) => (
              <tr 
                key={dia.data} 
                className="border-t border-gray-700 hover:bg-gray-700/30"
                onMouseMove={(e) => handleMouseMove(e, dia)}
              >
                <td className="p-3 whitespace-nowrap">{formatDate(dia.data)}</td>
                <td 
                    className={`p-3 text-right cursor-pointer hover:bg-gray-600/50 rounded-md ${dia.entradas > 0 ? 'text-green-500 bg-green-900/20' : 'text-gray-400'}`}
                    onClick={() => handleCellClick(dia.data, TipoCategoria.Entrada)}
                >{formatCurrency(dia.entradas)}</td>
                <td 
                    className={`p-3 text-right cursor-pointer hover:bg-gray-600/50 rounded-md ${dia.saidas > 0 ? 'text-red-500 bg-red-900/20' : 'text-gray-400'}`}
                    onClick={() => handleCellClick(dia.data, TipoCategoria.Saida)}
                >{formatCurrency(dia.saidas)}</td>
                 <td 
                    className={`p-3 text-right cursor-pointer hover:bg-gray-600/50 rounded-md ${dia.investimentos > 0 ? 'text-blue-400 bg-blue-900/20' : 'text-gray-400'}`}
                    onClick={() => handleCellClick(dia.data, TipoCategoria.Investimento)}
                >{formatCurrency(dia.investimentos)}</td>
                <td className="p-3 font-bold text-right text-white" style={getSaldoCellStyle(dia.saldoDiario)}>
                    {formatCurrency(dia.saldoDiario)}
                </td>
              </tr>
            ))}
            {fluxoData.length === 0 && (
              <tr className="border-t border-gray-700">
                <td colSpan={5} className="text-center text-gray-400 py-8">
                  Nenhum dado para o período selecionado.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-gray-700/50 sticky bottom-0">
             <tr className="border-t-2 border-gray-600">
                <th className="p-3 font-semibold text-sm">Totais do Mês</th>
                <td className="p-3 text-right font-bold text-green-500">{formatCurrency(totais.entradas)}</td>
                <td className="p-3 text-right font-bold text-red-500">{formatCurrency(totais.saidas)}</td>
                <td className="p-3 text-right font-bold text-blue-400">{formatCurrency(totais.investimentos)}</td>
                <td className="p-3"></td>
             </tr>
          </tfoot>
        </table>
        {tooltip && <Tooltip content={tooltip} />}
      </div>
       {manageSimModalState && (
            <ManageDaySimulationModal 
                date={manageSimModalState.date}
                type={manageSimModalState.type}
                transactions={simulationTransactions.filter(
                    t => t.data === manageSimModalState.date && t.tipo === manageSimModalState.type
                )}
                onClose={() => setManageSimModalState(null)}
                onAdd={handleAddSimulations}
                onUpdate={handleUpdateSimulation}
                onDelete={handleDeleteSimulation}
                categorias={categorias}
                contas={contas}
            />
        )}
    </div>
  );
};

type DayData = {
    data: string;
    entradas: number;
    saidas: number;
    investimentos: number;
    saldoDiario: number;
    transactions: TransacaoBanco[];
}

const Tooltip = ({ content }: { content: { x: number, y: number, dayData: DayData }}) => {
    return (
        <div 
            className="absolute z-20 w-64 bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-3 shadow-lg pointer-events-none transition-transform"
            style={{ transform: `translate(${content.x + 15}px, ${content.y + 15}px)`}}
        >
            <p className="font-bold text-white mb-2">{formatDate(content.dayData.data)}</p>
            <div className="space-y-1 max-h-48 overflow-y-auto text-xs no-scrollbar">
                {content.dayData.transactions.map(t => (
                    <div key={t.id} className={`flex justify-between ${t.id.startsWith('sim-') || t.id.startsWith('cc-') ? 'italic' : ''}`}>
                        <span className="truncate pr-2 text-gray-300">
                            {t.id.startsWith('sim-') && 'Sim: '}
                            {t.descricao}
                        </span>
                        <span className={`font-mono font-semibold whitespace-nowrap ${t.tipo === TipoCategoria.Entrada ? 'text-green-400' : 'text-red-400'}`}>
                            {t.tipo === TipoCategoria.Entrada ? '+' : '-'}{formatCurrency(t.valor)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

interface AddSimulationModalProps {
    categorias: Categoria[];
    contas: ContaBancaria[];
    modalState: {isOpen: boolean; type: TipoCategoria; date: string};
    onClose: () => void;
    onSubmit: (transactions: TransacaoBanco[]) => void;
}

const AddSimulationModal: React.FC<AddSimulationModalProps> = ({ categorias, contas, modalState, onClose, onSubmit }) => {
    type SimulationType = 'single' | 'installment' | 'recurring';
    const [form, setForm] = useState({
        valor: '',
        data: modalState.date,
        simulationType: 'single' as SimulationType,
        recurringType: 'mensal' as 'mensal' | 'semanal',
        installments: 2,
    });

    const handleSimulationTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, simulationType: e.target.value as SimulationType }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const valorNum = (parseFloat(form.valor) / 100) || 0;
        if (valorNum <= 0) return;

        const baseDesc = `Simulação: ${modalState.type}`;
        
        const catMap = {
            [TipoCategoria.Entrada]: 'Outras Entradas',
            [TipoCategoria.Saida]: 'Outras Despesas',
            [TipoCategoria.Investimento]: 'Investimento 1',
        };
        const defaultCatName = catMap[modalState.type] || 'Outras Despesas';
        const categoria = categorias.find(c => c.nome === defaultCatName && c.tipo === modalState.type);
        if (!categoria) {
            console.error("Categoria padrão de simulação não encontrada");
            return;
        }

        const newTxs: TransacaoBanco[] = [];
        const commonTxProps = {
            conta_id: 'simulated_account',
            categoria_id: categoria.id,
            tipo: modalState.type,
            previsto: true,
            realizado: false,
            meta_saldo_inicial: false,
        };
        
        if (form.simulationType === 'single') {
            newTxs.push({
                ...commonTxProps,
                id: `sim-${crypto.randomUUID()}`,
                data: form.data,
                valor: valorNum,
                descricao: baseDesc,
            });
        } else if (form.simulationType === 'installment') {
            const valoresParcelas = splitInstallments(valorNum, form.installments);
            for(let i = 0; i < form.installments; i++) {
                const txDate = new Date(`${form.data}T12:00:00Z`);
                txDate.setUTCMonth(txDate.getUTCMonth() + i);
                
                const desc = `${baseDesc} (Parcela ${i + 1}/${form.installments})`;

                newTxs.push({
                    ...commonTxProps,
                    id: `sim-${crypto.randomUUID()}`,
                    data: txDate.toISOString().split('T')[0],
                    valor: valoresParcelas[i],
                    descricao: desc,
                });
            }
        } else { // Recurring
            const loopCount = 12; // Simulate for a year
            for(let i = 0; i < loopCount; i++) {
                const txDate = new Date(`${form.data}T12:00:00Z`);
                if (form.recurringType === 'mensal') {
                    txDate.setUTCMonth(txDate.getUTCMonth() + i);
                } else { // weekly
                    txDate.setUTCDate(txDate.getUTCDate() + (i * 7));
                }
                
                const desc = `${baseDesc} (Recorrente ${i + 1})`;

                newTxs.push({
                    ...commonTxProps,
                    id: `sim-${crypto.randomUUID()}`,
                    data: txDate.toISOString().split('T')[0],
                    valor: valorNum,
                    descricao: desc,
                });
            }
        }
        
        const firstActiveAccount = contas.find(c => c.ativo);
        if(!firstActiveAccount) {
            alert("Crie ao menos uma conta bancária para rodar simulações.");
            return;
        }
        const finalTxs = newTxs.map(tx => ({...tx, conta_id: firstActiveAccount.id}));
        onSubmit(finalTxs);
    };

    const valorLabel = form.simulationType === 'installment' ? 'Valor Total' : 'Valor por Ocorrência';

    return (
        <Modal isOpen={true} onClose={onClose} title={`Simular ${modalState.type}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <p className="text-sm text-blue-300 bg-blue-900/40 p-2 rounded-md">Esta é uma simulação. Os dados inseridos aqui são temporários e não afetarão suas finanças reais.</p>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">{valorLabel}</label>
                        <CurrencyInput value={form.valor} onValueChange={(v) => setForm({...form, valor: v})} className="w-full bg-gray-700 p-2 rounded" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Data Inicial</label>
                        <input type="date" value={form.data} onChange={e => setForm({...form, data: e.target.value})} className="w-full bg-gray-700 p-2 rounded" required />
                    </div>
                 </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Simulação</label>
                    <div className="flex space-x-2 bg-gray-900/50 p-1 rounded-lg">
                        <label className={`flex-1 text-center p-2 rounded-md cursor-pointer text-sm ${form.simulationType === 'single' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>
                            <input type="radio" name="sim-type" value="single" checked={form.simulationType === 'single'} onChange={handleSimulationTypeChange} className="hidden"/> Único
                        </label>
                        <label className={`flex-1 text-center p-2 rounded-md cursor-pointer text-sm ${form.simulationType === 'installment' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>
                            <input type="radio" name="sim-type" value="installment" checked={form.simulationType === 'installment'} onChange={handleSimulationTypeChange} className="hidden"/> Parcelado
                        </label>
                         <label className={`flex-1 text-center p-2 rounded-md cursor-pointer text-sm ${form.simulationType === 'recurring' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>
                            <input type="radio" name="sim-type" value="recurring" checked={form.simulationType === 'recurring'} onChange={handleSimulationTypeChange} className="hidden"/> Recorrente
                        </label>
                    </div>
                </div>

                 {form.simulationType === 'installment' && (
                    <div className="pl-2 animate-fade-in">
                         <label className="block text-sm font-medium text-gray-300 mb-1">Número de Parcelas</label>
                         <input type="number" min="2" max="48" value={form.installments} onChange={e => setForm({...form, installments: Math.max(2, Number(e.target.value))})} className="w-full bg-gray-700 p-2 rounded" />
                    </div>
                 )}
                 {form.simulationType === 'recurring' && (
                    <div className="pl-2 animate-fade-in">
                        <label className="block text-sm font-medium text-gray-300 mb-1">Frequência</label>
                        <select value={form.recurringType} onChange={e => setForm({...form, recurringType: e.target.value as any})} className="w-full bg-gray-700 p-2 rounded">
                            <option value="mensal">Mensal</option>
                            <option value="semanal">Semanal</option>
                        </select>
                    </div>
                 )}
                 <div className="pt-4 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="bg-gray-600 px-4 py-2 rounded">Cancelar</button>
                    <button type="submit" className="bg-blue-600 px-4 py-2 rounded">Adicionar Simulação</button>
                 </div>
            </form>
        </Modal>
    );
};

interface EditSimulationModalProps {
    transaction: TransacaoBanco;
    onClose: () => void;
    onSave: (transaction: TransacaoBanco) => void;
    onDelete: (transactionId: string) => void;
}

const EditSimulationModal: React.FC<EditSimulationModalProps> = ({ transaction, onClose, onSave, onDelete }) => {
    const [form, setForm] = useState({
        valor: String(transaction.valor * 100),
        data: transaction.data,
    });
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const valorNum = (parseFloat(form.valor) / 100) || 0;
        if (valorNum <= 0) return;
        
        onSave({
            ...transaction,
            valor: valorNum,
            data: form.data,
        });
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Editar Simulação de ${transaction.tipo}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Valor</label>
                        <CurrencyInput value={form.valor} onValueChange={(v) => setForm({...form, valor: v})} className="w-full bg-gray-700 p-2 rounded" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Data</label>
                        <input type="date" value={form.data} onChange={e => setForm({...form, data: e.target.value})} className="w-full bg-gray-700 p-2 rounded" required />
                    </div>
                 </div>

                 <div className="pt-4 flex justify-between items-center">
                    <button type="button" onClick={() => onDelete(transaction.id)} className="bg-red-600/80 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-semibold flex items-center space-x-2">
                        <Trash2 size={16} />
                        <span>Excluir</span>
                    </button>
                    <div className="flex space-x-3">
                        <button type="button" onClick={onClose} className="bg-gray-600 px-4 py-2 rounded font-semibold">Cancelar</button>
                        <button type="submit" className="bg-blue-600 px-4 py-2 rounded font-semibold">Salvar Alterações</button>
                    </div>
                 </div>
            </form>
        </Modal>
    );
};

interface ManageDaySimulationModalProps {
    date: string;
    type: TipoCategoria;
    transactions: TransacaoBanco[];
    onClose: () => void;
    onAdd: (transactions: TransacaoBanco[]) => void;
    onUpdate: (transaction: TransacaoBanco) => void;
    onDelete: (transactionId: string) => void;
    categorias: Categoria[];
    contas: ContaBancaria[];
}

const ManageDaySimulationModal: React.FC<ManageDaySimulationModalProps> = ({ date, type, transactions, onClose, onAdd, onUpdate, onDelete, categorias, contas }) => {
    const [editingTx, setEditingTx] = useState<TransacaoBanco | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    if (editingTx) {
        return <EditSimulationModal 
            transaction={editingTx} 
            onClose={() => setEditingTx(null)}
            onSave={(tx) => { onUpdate(tx); setEditingTx(null); }}
            onDelete={(id) => { onDelete(id); setEditingTx(null); }}
        />;
    }

    if (isAdding) {
        return <AddSimulationModal 
            modalState={{ isOpen: true, type, date }}
            onClose={() => setIsAdding(false)}
            onSubmit={(txs) => { onAdd(txs); setIsAdding(false); }}
            categorias={categorias}
            contas={contas}
        />;
    }

    return (
        <Modal isOpen={true} onClose={onClose} title={`Simulações de ${type} em ${formatDate(date)}`}>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {transactions.length === 0 && (
                    <p className="text-gray-400 text-center py-4">Nenhuma simulação para este dia.</p>
                )}
                {transactions.map(tx => (
                    <div key={tx.id} className="bg-gray-700/50 p-3 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="text-white font-semibold">{tx.descricao}</p>
                            <p className="text-sm text-gray-300">{formatCurrency(tx.valor)}</p>
                        </div>
                        <div className="flex space-x-2">
                            <button onClick={() => setEditingTx(tx)} className="text-gray-400 hover:text-blue-400 p-1 rounded-full"><Pencil size={18}/></button>
                            <button onClick={() => onDelete(tx.id)} className="text-gray-400 hover:text-red-400 p-1 rounded-full"><Trash2 size={18}/></button>
                        </div>
                    </div>
                ))}
            </div>
             <div className="pt-4 mt-2 border-t border-gray-700">
                <button 
                    onClick={() => setIsAdding(true)} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2"
                >
                    <Plus size={20} />
                    <span>Adicionar Nova Simulação</span>
                </button>
            </div>
        </Modal>
    );
};


export default FluxoCaixaPage;
