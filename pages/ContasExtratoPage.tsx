import React, { useState, useMemo, useEffect } from 'react';
import { ContaBancaria, TransacaoBanco, Categoria, TipoCategoria, ModalState, NavigationState } from '../types';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import CurrencyInput from '../components/CurrencyInput';
import { formatCurrency, formatDate } from '../utils/format';
import { Plus, Pencil, Trash2, FilterX, Search, ArrowRightLeft, Landmark } from 'lucide-react';
import KpiCard from '../components/KpiCard';
import { getCategoryIcon } from '../constants';
import DatePeriodSelector from '../components/DatePeriodSelector';

const getTodayString = () => new Date().toISOString().split('T')[0];

// Helper function to calculate balance for a single account
const calculateSaldo = (contaId: string, transacoes: TransacaoBanco[]): number => {
    return transacoes
        .filter(t => t.conta_id === contaId && t.realizado)
        .reduce((sum, t) => {
            if (t.tipo === TipoCategoria.Entrada) return sum + t.valor;
            if (t.tipo === TipoCategoria.Saida) return sum - t.valor;
            if (t.tipo === TipoCategoria.Transferencia) {
                if (t.meta_saldo_inicial) return sum + t.valor;
                if (t.meta_pagamento) return sum - t.valor;
                // Simple deterministic rule for two-leg transfers: smaller ID is debit
                const pair = transacoes.find(p => p.id === t.transferencia_par_id);
                if (pair && t.id < pair.id) return sum - t.valor;
                return sum + t.valor;
            }
            return sum;
        }, 0);
};

interface ContasExtratoPageProps {
  contas: ContaBancaria[];
  transacoes: TransacaoBanco[];
  categorias: Categoria[];
  addConta: (conta: { nome: string; saldo_inicial: number; ativo: boolean; data_inicial: string; }) => boolean;
  updateConta: (conta: Omit<ContaBancaria, 'saldo_inicial'>, novoSaldoInicial: number, novaDataInicial: string) => void;
  deleteConta: (id: string) => void;
  deleteTransacao: (id: string) => void;
  deleteTransacoes: (ids: string[]) => void;
  modalState: ModalState;
  openModal: (modal: string, data?: any) => void;
  closeModal: () => void;
  selectedView: 'all' | string;
  setSelectedView: (id: 'all' | string) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  navigationState: NavigationState | null;
  clearNavigationState: () => void;
}

const ContasExtratoPage: React.FC<ContasExtratoPageProps> = ({
  contas, transacoes, categorias, addConta, updateConta, deleteConta, deleteTransacao, deleteTransacoes,
  modalState, openModal, closeModal, selectedView, setSelectedView, selectedMonth, onMonthChange,
  navigationState, clearNavigationState
}) => {
  const [filters, setFilters] = useState({ categoriaFiltro: '', tipoFiltro: '', textoFiltro: '' });
  
  const [editingConta, setEditingConta] = useState<ContaBancaria | null>(null);
  const [isSaldoInicialEditBlocked, setSaldoInicialEditBlocked] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Form states
  const [contaForm, setContaForm] = useState({ nome: '', saldo_inicial: '', data_inicial: getTodayString(), ativo: true });
  
  const isContaModalOpen = modalState.modal === 'nova-conta' || modalState.modal === 'editar-conta';

  // Consume navigation state
  useEffect(() => {
    if (navigationState?.filters) {
        setFilters(f => ({ ...f, ...navigationState.filters }));
        clearNavigationState();
    }
  }, [navigationState, clearNavigationState]);


  const contasComSaldo = useMemo(() => {
    return contas.map(conta => ({
      ...conta,
      saldoAtual: calculateSaldo(conta.id, transacoes),
    }));
  }, [contas, transacoes]);

  const kpisData = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const startDate = `${selectedMonth}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    
    const contasVisiveis = selectedView === 'all' ? contasComSaldo : contasComSaldo.filter(c => c.id === selectedView);
    const contasVisiveisIds = new Set(contasVisiveis.map(c => c.id));
    
    const saldoConsolidado = contasVisiveis.reduce((sum, c) => sum + c.saldoAtual, 0);

    const transacoesMes = transacoes.filter(t => 
        t.data >= startDate && t.data <= endDate && contasVisiveisIds.has(t.conta_id) && t.realizado
    );
    
    const entradasMes = transacoesMes
        .filter(t => t.tipo === TipoCategoria.Entrada || (t.tipo === TipoCategoria.Transferencia && t.meta_saldo_inicial))
        .reduce((sum, t) => sum + t.valor, 0);
        
    const saidasMes = transacoesMes
        .filter(t => t.tipo === TipoCategoria.Saida)
        .reduce((sum, t) => sum + t.valor, 0);

    return { saldoConsolidado, entradasMes, saidasMes };
  }, [contasComSaldo, transacoes, selectedView, selectedMonth]);

  const transacoesFiltradas = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const startDate = `${selectedMonth}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    const contasVisiveisIds = selectedView === 'all' ? new Set(contas.map(c => c.id)) : new Set([selectedView]);

    return transacoes
      .filter(t => t.data >= startDate && t.data <= endDate)
      .filter(t => contasVisiveisIds.has(t.conta_id))
      .filter(t => !filters.categoriaFiltro || t.categoria_id === filters.categoriaFiltro)
      .filter(t => !filters.tipoFiltro || t.tipo === filters.tipoFiltro)
      .filter(t => !filters.textoFiltro || t.descricao.toLowerCase().includes(filters.textoFiltro.toLowerCase()))
      .sort((a, b) => b.data.localeCompare(a.data) || b.id.localeCompare(a.id));
  }, [transacoes, selectedMonth, selectedView, contas, filters]);
  
  // Effects to populate form data when a modal opens
  useEffect(() => {
    if (isContaModalOpen) {
        const conta = modalState.data?.conta as ContaBancaria | null;
        setEditingConta(conta);
        if (conta) {
            const transacaoSaldoInicial = transacoes.find(t => t.conta_id === conta.id && t.meta_saldo_inicial);
            const outrasTransacoes = transacoes.some(t => t.conta_id === conta.id && !t.meta_saldo_inicial);
            setSaldoInicialEditBlocked(outrasTransacoes);
          setContaForm({ 
              nome: conta.nome, 
              saldo_inicial: String((transacaoSaldoInicial?.valor || 0) * 100), 
              data_inicial: conta.data_inicial,
              ativo: conta.ativo 
          });
        } else {
          setSaldoInicialEditBlocked(false);
          setContaForm({ nome: '', saldo_inicial: '', data_inicial: getTodayString(), ativo: true });
        }
    }
  }, [isContaModalOpen, modalState.data, transacoes]);

  const handleContaSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!contaForm.nome || !contaForm.data_inicial) return;
      const saldo = parseFloat(contaForm.saldo_inicial) / 100 || 0;
      
      let success = false;
      if (editingConta) {
          const contaDataToUpdate: Omit<ContaBancaria, 'saldo_inicial' | 'updatedAt'> = {
            id: editingConta.id,
            nome: contaForm.nome,
            data_inicial: contaForm.data_inicial,
            ativo: contaForm.ativo,
            createdAt: editingConta.createdAt,
          };
          updateConta(contaDataToUpdate, saldo, contaForm.data_inicial);
          success = true;
      } else {
          success = addConta({ nome: contaForm.nome, saldo_inicial: saldo, ativo: contaForm.ativo, data_inicial: contaForm.data_inicial });
      }
      if (success) {
          closeModal();
      }
  };

  const handleEditClick = (t: TransacaoBanco) => {
    if (t.transferencia_par_id && !t.meta_pagamento) { // Regular transfer
        openModal('editar-transferencia', { transferencia: t });
    } else { // Normal transaction, Saldo Inicial, Pagamento Fatura
        openModal('editar-transacao', { transacao: t });
    }
  };
  
  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };
  
  const clearFilters = () => setFilters({ categoriaFiltro: '', tipoFiltro: '', textoFiltro: '' });

  const handleSelect = (id: string) => setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
      return newSet;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) { setSelectedIds(new Set(transacoesFiltradas.map(t => t.id))); } 
    else { setSelectedIds(new Set()); }
  };

  const handleBulkDelete = () => {
    deleteTransacoes(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  return (
    <div className="animate-fade-in flex flex-col h-full">
        {/* Header */}
        <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-2">Contas e Extrato</h2>
        </div>
        <div className="flex justify-center mb-6">
            <DatePeriodSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} />
        </div>
        
        {/* Body */}
        <div className="flex flex-1 space-x-6 overflow-hidden">
            {/* Account Navigation Sidebar */}
            <div className="w-72 bg-gray-800 rounded-lg flex flex-col p-3">
                <div className="flex-grow space-y-2 overflow-y-auto no-scrollbar">
                <button onClick={() => setSelectedView('all')} className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors ${selectedView === 'all' ? 'bg-green-500/80 text-white' : 'bg-gray-700/50 hover:bg-gray-700'}`}>
                    <div className="flex items-center space-x-3"><Landmark size={20} /><span>Todas as Contas</span></div>
                </button>
                <hr className="border-gray-700" />
                {contasComSaldo.filter(c => c.ativo).sort((a, b) => a.nome.localeCompare(b.nome)).map(conta => (
                    <button key={conta.id} onClick={() => setSelectedView(conta.id)} className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors ${selectedView === conta.id ? 'bg-green-500/80 text-white' : 'bg-gray-700/50 hover:bg-gray-700'}`}>
                    <span className="font-medium">{conta.nome}</span>
                    <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${conta.saldoAtual >= 0 ? 'bg-green-200/20 text-green-300' : 'bg-red-200/20 text-red-300'}`}>{formatCurrency(conta.saldoAtual)}</span>
                    </button>
                ))}
                {contas.length === 0 && (
                        <div className="text-center py-10 text-gray-500">
                            <p>Nenhuma conta cadastrada.</p>
                        </div>
                    )}
                </div>
                <div className="pt-3 mt-auto border-t border-gray-700/50">
                <button onClick={() => openModal('nova-conta')} className="w-full text-center p-2 rounded-lg flex items-center justify-center space-x-2 transition-colors bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white opacity-70 hover:opacity-100">
                    <Plus size={16} /><span>Nova Conta</span>
                </button>
                </div>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <KpiCard label="Saldo Consolidado" value={kpisData.saldoConsolidado} icon="bank" />
                    <KpiCard label="Entradas no Mês" value={kpisData.entradasMes} icon="up" />
                    <KpiCard label="Saídas no Mês" value={kpisData.saidasMes} icon="down" />
                </div>

                <div className="bg-gray-800 rounded-lg p-4 flex-grow flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Extrato do Mês</h3>
                    <div className="flex space-x-2">
                    <button onClick={() => openModal('nova-transferencia', { contaId: selectedView !== 'all' ? selectedView : undefined })} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded-lg flex items-center space-x-2 text-sm"> <ArrowRightLeft size={16}/><span>Nova Transferência</span> </button>
                    <button onClick={() => openModal('nova-transacao', { contaId: selectedView !== 'all' ? selectedView : undefined })} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-lg flex items-center space-x-2 text-sm"> <Plus size={16}/><span>Nova Transação</span> </button>
                    </div>
                </div>
                
                    <div className="bg-gray-800/50 rounded-lg p-4 mb-4 border border-gray-700/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <select value={filters.categoriaFiltro} onChange={e => handleFilterChange('categoriaFiltro', e.target.value)} className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                                <option value="">Todas as Categorias</option>
                                {categorias.filter(c => !c.sistema).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                            </select>
                            <select value={filters.tipoFiltro} onChange={e => handleFilterChange('tipoFiltro', e.target.value)} className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                                <option value="">Todos os Tipos</option>
                                {Object.values(TipoCategoria).filter(t => t !== TipoCategoria.Transferencia).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <div className="relative col-span-1 md:col-span-2 lg:col-span-1">
                                <input type="text" value={filters.textoFiltro} onChange={e => handleFilterChange('textoFiltro', e.target.value)} placeholder="Buscar por descrição..." className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                            </div>
                            <button onClick={clearFilters} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors">
                                <FilterX size={18} /><span>Limpar Filtros</span>
                            </button>
                        </div>
                    </div>

                    {selectedIds.size > 0 && (
                        <div className="bg-blue-900/50 border border-blue-700 rounded-lg p-3 mb-4 flex justify-between items-center animate-fade-in">
                            <span className="text-white">{selectedIds.size} transaçõ{selectedIds.size > 1 ? 'es' : 'ão'} selecionada{selectedIds.size > 1 ? 's' : ''}</span>
                            <button onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg flex items-center space-x-2 text-sm"> <Trash2 size={16} /><span>Excluir Selecionadas</span> </button>
                        </div>
                    )}

                <div className="overflow-y-auto flex-grow">
                    <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-gray-800">
                        <tr>
                        <th className="p-3 w-12"><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.size > 0 && selectedIds.size === transacoesFiltradas.length} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 bg-gray-700" /></th>
                        <th className="p-3 font-semibold">Data</th>
                        {selectedView === 'all' && <th className="p-3 font-semibold">Conta</th>}
                        <th className="p-3 font-semibold">Descrição</th>
                        <th className="p-3 font-semibold">Categoria</th>
                        <th className="p-3 font-semibold text-right">Valor</th>
                        <th className="p-3 font-semibold text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transacoesFiltradas.map(t => {
                            const categoria = categorias.find(c => c.id === t.categoria_id);
                            const isSaldoInicial = t.meta_saldo_inicial;
                            const isSaldoInicialBlocked = isSaldoInicial && transacoes.some(tx => tx.conta_id === t.conta_id && !tx.meta_saldo_inicial);
                            const actionTooltip = isSaldoInicialBlocked ? "Edição de saldo inicial bloqueada pois a conta já possui outros movimentos." : "Editar transação";

                            return (
                                <tr key={t.id} className={`border-t border-gray-700 ${selectedIds.has(t.id) ? 'bg-blue-900/30' : 'hover:bg-gray-700/50'}`}>
                                    <td className="p-3"><input type="checkbox" checked={selectedIds.has(t.id)} onChange={() => handleSelect(t.id)} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 bg-gray-700" /></td>
                                    <td className="p-3">{formatDate(t.data)}</td>
                                    {selectedView === 'all' && <td className="p-3">{contas.find(c => c.id === t.conta_id)?.nome}</td>}
                                    <td className="p-3">{t.descricao}</td>
                                    <td className="p-3 flex items-center space-x-2">{categoria && getCategoryIcon(categoria.tipo)}<span>{categoria?.nome}</span></td>
                                    <td className={`p-3 text-right font-semibold ${t.tipo === 'Entrada' || (t.tipo === 'Transferencia' && t.meta_saldo_inicial) ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(t.valor)}</td>
                                    <td className="p-3 flex justify-center space-x-3">
                                        <button onClick={() => handleEditClick(t)} className={`text-gray-400 ${isSaldoInicialBlocked ? 'cursor-not-allowed text-gray-600' : 'hover:text-blue-400'}`} title={actionTooltip} disabled={isSaldoInicialBlocked}><Pencil size={16}/></button>
                                        <button onClick={() => deleteTransacao(t.id)} className={`text-gray-400 ${isSaldoInicialBlocked ? 'cursor-not-allowed text-gray-600' : 'hover:text-red-400'}`} title={actionTooltip.replace('Edição', 'Exclusão')} disabled={isSaldoInicialBlocked}><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            )
                        })}
                        {transacoesFiltradas.length === 0 && ( <tr><td colSpan={selectedView === 'all' ? 7 : 6} className="text-center text-gray-400 py-8">Nenhuma transação encontrada para este período.</td></tr> )}
                    </tbody>
                    </table>
                </div>
                </div>
            </div>
        </div>
      
      {/* Modals */}
        <Modal isOpen={isContaModalOpen} onClose={closeModal} title={editingConta ? "Editar Conta" : "Nova Conta"} footer={
            <>
                <button type="button" onClick={closeModal} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                <button type="submit" form="conta-form" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">Salvar</button>
            </>
        }>
            <form id="conta-form" onSubmit={handleContaSubmit} className="space-y-4">
                <div><label htmlFor="nome-conta" className="block text-sm font-medium text-gray-300 mb-1">Nome da Conta</label><input id="nome-conta" type="text" value={contaForm.nome} onChange={e => setContaForm({...contaForm, nome: e.target.value})} required className="w-full bg-gray-700 p-2 rounded" placeholder="Ex.: Conta Corrente Nubank"/></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label htmlFor="data-inicial-conta" className="block text-sm font-medium text-gray-300 mb-1">Data Inicial da Conta</label><input id="data-inicial-conta" type="date" value={contaForm.data_inicial} onChange={e => setContaForm({...contaForm, data_inicial: e.target.value})} required className="w-full bg-gray-700 p-2 rounded" disabled={isSaldoInicialEditBlocked}/></div>
                  <div><label htmlFor="saldo-conta" className="block text-sm font-medium text-gray-300 mb-1">Saldo Inicial</label><CurrencyInput id="saldo-conta" value={contaForm.saldo_inicial} onValueChange={v => setContaForm({...contaForm, saldo_inicial: v})} required className="w-full bg-gray-700 p-2 rounded" placeholder="R$ 0,00" disabled={isSaldoInicialEditBlocked}/></div>
                </div>
                {isSaldoInicialEditBlocked && <p className="text-xs text-yellow-400">Data e saldo inicial não podem ser editados pois a conta já possui outras transações.</p>}
                <div className="flex items-center"><input type="checkbox" id="ativa-conta" checked={contaForm.ativo} onChange={e => setContaForm({...contaForm, ativo: e.target.checked})} className="h-4 w-4 rounded"/> <label htmlFor="ativa-conta" className="ml-2 text-sm text-gray-300">Ativa</label></div>
            </form>
        </Modal>

    </div>
  );
};

export default ContasExtratoPage;