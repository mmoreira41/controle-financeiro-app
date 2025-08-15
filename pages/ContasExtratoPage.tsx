

import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Pencil, Trash2, FilterX, Search, ArrowRightLeft, Landmark } from 'lucide-react';

import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import CurrencyInput from '../components/CurrencyInput';
import KPICard from '../components/KPICard';
import DatePeriodSelector from '../components/DatePeriodSelector';
import { ContaBancaria, TransacaoBanco, Categoria, TipoCategoria, ModalState, NavigationState } from '../types';
import { getCategoryIcon } from '../constants';
import { formatCurrency, formatDate, calculateSaldo } from '../utils/format';


const getTodayString = () => new Date().toISOString().split('T')[0];

interface ContasExtratoPageProps {
  contas: ContaBancaria[];
  transacoes: TransacaoBanco[];
  categorias: Categoria[];
  addConta: (conta: { nome: string; saldo_inicial: number; ativo: boolean; data_inicial: string; }) => ContaBancaria | null;
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
        .filter(t => t.tipo === TipoCategoria.Saida || t.tipo === TipoCategoria.Investimento)
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
      
      if (editingConta) {
          const contaDataToUpdate: Omit<ContaBancaria, 'saldo_inicial' | 'updatedAt'> = {
            id: editingConta.id,
            nome: contaForm.nome,
            data_inicial: contaForm.data_inicial,
            ativo: contaForm.ativo,
            createdAt: editingConta.createdAt,
          };
          updateConta(contaDataToUpdate, saldo, contaForm.data_inicial);
          closeModal();
      } else {
          const novaConta = addConta({ nome: contaForm.nome, saldo_inicial: saldo, ativo: contaForm.ativo, data_inicial: contaForm.data_inicial });
          if (novaConta) {
              closeModal();
          }
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

  const handleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
      return newSet;
    });
  };

  const handleSelectAll = () => {
      if (selectedIds.size === transacoesFiltradas.length) {
          setSelectedIds(new Set());
      } else {
          setSelectedIds(new Set(transacoesFiltradas.map(t => t.id)));
      }
  };

  const isAllSelected = selectedIds.size > 0 && selectedIds.size === transacoesFiltradas.length;

  const selectedConta = selectedView !== 'all' ? contas.find(c => c.id === selectedView) : null;

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
        <div className="w-64 bg-gray-800 rounded-lg flex flex-col p-3">
          <div className="flex-grow space-y-2 overflow-y-auto no-scrollbar">
            <button onClick={() => setSelectedView('all')} className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors ${selectedView === 'all' ? 'bg-green-500/80 text-white' : 'bg-gray-700/50 hover:bg-gray-700'}`}>
              <span className="flex items-center space-x-3"><Landmark size={20} /><span>Todas as Contas</span></span>
              <span className="text-xs font-mono">{formatCurrency(contasComSaldo.reduce((acc, c) => acc + c.saldoAtual, 0))}</span>
            </button>
            <hr className="border-gray-700" />
            {contasComSaldo.filter(c => c.ativo).sort((a,b) => a.nome.localeCompare(b.nome)).map(conta => (
              <button key={conta.id} onClick={() => setSelectedView(conta.id)} className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors ${selectedView === conta.id ? 'bg-green-500/80 text-white' : 'bg-gray-700/50 hover:bg-gray-700'}`}>
                <span className="flex items-center space-x-3"><Landmark size={20} /><span>{conta.nome}</span></span>
                <span className="text-xs font-mono">{formatCurrency(conta.saldoAtual)}</span>
              </button>
            ))}
            {contasComSaldo.filter(c => !c.ativo).length > 0 && <hr className="border-gray-700" />}
            {contasComSaldo.filter(c => !c.ativo).sort((a,b) => a.nome.localeCompare(b.nome)).map(conta => (
                <button key={conta.id} onClick={() => setSelectedView(conta.id)} className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors text-gray-500 ${selectedView === conta.id ? 'bg-green-500/80 text-white' : 'bg-gray-700/50 hover:bg-gray-700'}`}>
                <span className="flex items-center space-x-3"><Landmark size={20} /><span>{conta.nome}</span></span>
                <span className="text-xs font-mono">{formatCurrency(conta.saldoAtual)}</span>
              </button>
            ))}
          </div>
          <div className="pt-3 mt-auto border-t border-gray-700/50">
            <button onClick={() => openModal('nova-conta')} className="w-full text-center p-2 rounded-lg flex items-center justify-center space-x-2 transition-colors bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white opacity-70 hover:opacity-100">
              <Plus size={16} /><span>Nova Conta</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-gray-800 rounded-lg p-4 overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <div>
                <h3 className="text-lg font-semibold">{selectedConta ? `Extrato: ${selectedConta.nome}` : 'Extrato Consolidado'}</h3>
                {selectedConta && <div className="flex space-x-2 mt-1"><button onClick={() => openModal('editar-conta', { conta: selectedConta })} className="text-xs text-gray-400 hover:text-blue-400">Editar</button><button onClick={() => deleteConta(selectedConta.id)} className="text-xs text-gray-400 hover:text-red-400">Excluir</button></div>}
            </div>
            <div className="flex space-x-2">
                <KPICard label="Entradas" value={kpisData.entradasMes} icon="up" />
                <KPICard label="Saídas" value={kpisData.saidasMes} icon="down" />
                <KPICard label="Saldo" value={kpisData.saldoConsolidado} icon="bank" />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2 mb-4 p-2 bg-gray-900/50 rounded-lg">
             <div className="relative flex-grow">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Buscar por descrição..." value={filters.textoFiltro} onChange={e => handleFilterChange('textoFiltro', e.target.value)} className="w-full bg-gray-700 pl-10 pr-4 py-2 rounded-md text-sm" />
             </div>
             <select value={filters.categoriaFiltro} onChange={e => handleFilterChange('categoriaFiltro', e.target.value)} className="bg-gray-700 p-2 rounded-md text-sm">
                <option value="">Todas as categorias</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
             </select>
             <select value={filters.tipoFiltro} onChange={e => handleFilterChange('tipoFiltro', e.target.value)} className="bg-gray-700 p-2 rounded-md text-sm">
                <option value="">Todos os tipos</option>
                {Object.values(TipoCategoria).map(t => <option key={t} value={t}>{t}</option>)}
             </select>
             <button onClick={clearFilters} className="p-2 bg-gray-700 rounded-md hover:bg-gray-600" title="Limpar filtros"><FilterX size={20}/></button>
          </div>

          <div className="overflow-y-auto flex-grow">
            <table className="w-full text-center text-sm">
                <thead className="sticky top-0 bg-gray-800">
                    <tr>
                        <th className="p-2 w-10"><input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} className="h-4 w-4" /></th>
                        <th className="p-2 font-semibold text-left">Data</th>
                        {selectedView === 'all' && <th className="p-2 font-semibold text-left">Conta</th>}
                        <th className="p-2 font-semibold text-left">Descrição</th>
                        <th className="p-2 font-semibold text-left">Categoria</th>
                        <th className="p-2 font-semibold text-right">Valor</th>
                        <th className="p-2 font-semibold text-center w-24">Ações</th>
                    </tr>
                </thead>
                <tbody>
                {transacoesFiltradas.map(t => {
                    const categoria = categorias.find(c => c.id === t.categoria_id);
                    const conta = selectedView === 'all' ? contas.find(c => c.id === t.conta_id) : null;
                    const isTransfer = t.tipo === TipoCategoria.Transferencia && !t.meta_saldo_inicial && !t.meta_pagamento;
                    let valor = t.valor;
                    let valorClass = "text-gray-300";
                    if (t.tipo === TipoCategoria.Entrada || (isTransfer && t.transferencia_par_id && t.id > t.transferencia_par_id)) {
                        valorClass = "text-green-500";
                    } else if (t.tipo === TipoCategoria.Saida || t.tipo === TipoCategoria.Investimento || t.meta_pagamento || (isTransfer && t.transferencia_par_id && t.id < t.transferencia_par_id)) {
                        valorClass = "text-red-500";
                        valor = -t.valor;
                    }

                    return (
                        <tr key={t.id} className="border-t border-gray-700 hover:bg-gray-700/50">
                            <td className="p-2"><input type="checkbox" checked={selectedIds.has(t.id)} onChange={() => handleSelect(t.id)} className="h-4 w-4" /></td>
                            <td className="p-2 text-left">{formatDate(t.data)}</td>
                            {selectedView === 'all' && <td className="p-2 text-left">{conta?.nome}</td>}
                            <td className="p-2 text-left flex items-center space-x-2">
                                {isTransfer && <ArrowRightLeft size={14} className="text-blue-400"/>}
                                <span>{t.descricao}</span>
                                {!t.realizado && <span className="text-xs font-bold text-yellow-400 bg-yellow-900/50 px-2 py-0.5 rounded-full">Previsto</span>}
                            </td>
                            <td className="p-2 text-left flex items-center space-x-2">
                                {categoria && getCategoryIcon(categoria.tipo)}
                                <span>{categoria?.nome || 'N/A'}</span>
                            </td>
                            <td className={`p-2 text-right font-medium ${valorClass}`}>{formatCurrency(valor)}</td>
                            <td className="p-2">
                                <div className="flex justify-center space-x-3">
                                <button onClick={() => handleEditClick(t)} className="text-gray-400 hover:text-blue-400"><Pencil size={16}/></button>
                                <button onClick={() => deleteTransacao(t.id)} className="text-gray-400 hover:text-red-400"><Trash2 size={16}/></button>
                                </div>
                            </td>
                        </tr>
                    );
                })}
                {transacoesFiltradas.length === 0 && (
                    <tr><td colSpan={selectedView === 'all' ? 7 : 6} className="text-center text-gray-400 py-8">Nenhuma transação encontrada para os filtros aplicados.</td></tr>
                )}
                </tbody>
            </table>
          </div>
          {selectedIds.size > 0 && (
            <div className="mt-4 p-2 bg-gray-900/50 rounded-lg flex justify-between items-center">
                <span>{selectedIds.size} transações selecionadas</span>
                <button onClick={() => deleteTransacoes(Array.from(selectedIds))} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-lg flex items-center space-x-2">
                    <Trash2 size={16} />
                    <span>Excluir Selecionadas</span>
                </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={isContaModalOpen} onClose={closeModal} title={editingConta ? "Editar Conta" : "Nova Conta"}>
        <form onSubmit={handleContaSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-300 mb-1">Nome da Conta</label><input type="text" value={contaForm.nome} onChange={e => setContaForm({...contaForm, nome: e.target.value})} required className="w-full bg-gray-700 p-2 rounded"/></div>
            <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-300 mb-1">Saldo Inicial</label><CurrencyInput value={contaForm.saldo_inicial} onValueChange={v => setContaForm({...contaForm, saldo_inicial: v})} required className="w-full bg-gray-700 p-2 rounded" placeholder="R$ 0,00" disabled={isSaldoInicialEditBlocked} /></div>
                <div><label className="block text-sm font-medium text-gray-300 mb-1">Data do Saldo</label><input type="date" value={contaForm.data_inicial} onChange={e => setContaForm({...contaForm, data_inicial: e.target.value})} required className="w-full bg-gray-700 p-2 rounded" disabled={isSaldoInicialEditBlocked}/></div>
            </div>
            {isSaldoInicialEditBlocked && <p className="text-xs text-yellow-400">O saldo inicial não pode ser editado pois a conta já possui transações.</p>}
            <div className="flex items-center"><input type="checkbox" id="conta-ativa" checked={contaForm.ativo} onChange={e => setContaForm({...contaForm, ativo: e.target.checked})} className="h-4 w-4 rounded"/> <label htmlFor="conta-ativa" className="ml-2 text-sm text-gray-300">Conta Ativa</label></div>
            <div className="pt-4 flex justify-end space-x-3"><button type="button" onClick={closeModal} className="bg-gray-600 px-4 py-2 rounded">Cancelar</button><button type="submit" className="bg-green-500 px-4 py-2 rounded">Salvar</button></div>
        </form>
      </Modal>
    </div>
  );
};

export default ContasExtratoPage;