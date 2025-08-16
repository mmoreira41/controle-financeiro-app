import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Pencil, Trash2, FilterX, Search, ArrowRightLeft, Landmark } from 'lucide-react';

import Modal from '../components/Modal';
import CurrencyInput from '../components/CurrencyInput';
import KPICard from '../components/KPICard';
import DatePeriodSelector from '../components/DatePeriodSelector';
import { ContaBancaria, TransacaoBanco, Categoria, TipoCategoria, ModalState, NavigationState } from '../types';
import { getCategoryIcon } from '../constants';
import { formatCurrency, formatDate, calculateSaldo } from '../utils/format';
import MobileSelector from '../components/MobileSelector';

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
  updateTransacoesCategoria: (ids: string[], newCategoryId: string) => void;
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
  contas, transacoes, categorias, addConta, updateConta, deleteConta, deleteTransacao, deleteTransacoes, updateTransacoesCategoria,
  modalState, openModal, closeModal, selectedView, setSelectedView, selectedMonth, onMonthChange,
  navigationState, clearNavigationState
}) => {
  const [filters, setFilters] = useState({ categoriaFiltro: '', tipoFiltro: '', textoFiltro: '' });
  
  const [editingConta, setEditingConta] = useState<ContaBancaria | null>(null);
  const [isSaldoInicialEditBlocked, setSaldoInicialEditBlocked] = useState(false);
  const [isMassEditModalOpen, setIsMassEditModalOpen] = useState(false);
  const [massEditCategoryId, setMassEditCategoryId] = useState('');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Form states
  const [contaForm, setContaForm] = useState({ nome: '', saldo_inicial: '', data_inicial: getTodayString(), ativo: true });
  
  const isContaModalOpen = modalState.modal === 'nova-conta' || modalState.modal === 'editar-conta';

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

  const handleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
      return newSet;
    });
  };

  const isAllSelected = transacoesFiltradas.length > 0 && selectedIds.size === transacoesFiltradas.length;

  const handleSelectAll = () => {
    if (isAllSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(transacoesFiltradas.map(t => t.id)));
  };
  
  const handleConfirmMassEdit = () => {
    if (!massEditCategoryId) return;
    updateTransacoesCategoria(Array.from(selectedIds), massEditCategoryId);
    setIsMassEditModalOpen(false);
    setSelectedIds(new Set());
    setMassEditCategoryId('');
  };

  useEffect(() => {
    setSelectedIds(new Set());
  }, [filters, selectedView, selectedMonth]);

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
          if (novaConta) closeModal();
      }
  };

  const handleEditClick = (t: TransacaoBanco) => {
    if (t.transferencia_par_id && !t.meta_pagamento) openModal('editar-transferencia', { transferencia: t });
    else openModal('editar-transacao', { transacao: t });
  };
  
  const handleFilterChange = (filterName: keyof typeof filters, value: string) => setFilters(prev => ({ ...prev, [filterName]: value }));
  const clearFilters = () => setFilters({ categoriaFiltro: '', tipoFiltro: '', textoFiltro: '' });

  const renderTransactionRow = (t: TransacaoBanco, isMobile = false) => {
    const categoria = categorias.find(c => c.id === t.categoria_id);
    const isTransfer = t.tipo === TipoCategoria.Transferencia && !t.meta_pagamento && !t.meta_saldo_inicial;
    const pair = isTransfer ? transacoes.find(p => p.id === t.transferencia_par_id) : null;
    const isDebit = isTransfer && pair && t.id < pair.id;
    const transferAccountName = isTransfer && pair ? contas.find(c => c.id === (isDebit ? pair.conta_id : pair?.conta_id))?.nome : '';
    const valorColor = t.tipo === TipoCategoria.Entrada ? 'text-green-400' : t.tipo === TipoCategoria.Transferencia ? 'text-yellow-400' : 'text-red-400';

    if(isMobile) {
        return (
            <div key={t.id} className={`p-4 border-t border-gray-700 ${selectedIds.has(t.id) ? 'bg-green-900/50' : ''}`} onClick={() => handleSelect(t.id)}>
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center space-x-2">
                            {isTransfer && <span title={`Transferência ${isDebit ? 'para' : 'de'} ${transferAccountName}`}><ArrowRightLeft size={14} className="text-yellow-400 flex-shrink-0" /></span>}
                            <span className="font-semibold text-white">{t.descricao}</span>
                        </div>
                         <div className="flex items-center space-x-2 text-sm text-gray-400 mt-1">{categoria && getCategoryIcon(categoria.tipo)}<span>{categoria?.nome || 'N/A'}</span></div>
                    </div>
                    <div className="text-right ml-2">
                        <div className={`font-bold ${valorColor}`}>{formatCurrency(t.valor)}</div>
                        <div className="text-xs text-gray-400">{formatDate(t.data)}</div>
                    </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                     <span className={`px-2 py-0.5 text-xs rounded-full ${t.realizado ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>{t.realizado ? 'Realizado' : 'Previsto'}</span>
                     <div className="flex justify-center space-x-3">
                        <button onClick={(e) => { e.stopPropagation(); handleEditClick(t); }} className="text-gray-400 hover:text-blue-400"><Pencil size={16}/></button>
                        <button onClick={(e) => { e.stopPropagation(); deleteTransacao(t.id); }} className="text-gray-400 hover:text-red-400"><Trash2 size={16}/></button>
                     </div>
                </div>
            </div>
        )
    }

    return (
        <tr key={t.id} className={`border-t border-gray-700 hover:bg-gray-700/50 ${selectedIds.has(t.id) ? 'bg-green-900/50' : ''}`} onClick={() => handleSelect(t.id)}>
            <td className="p-3 text-center"><input type="checkbox" className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-offset-gray-800 focus:ring-green-500" checked={selectedIds.has(t.id)} onChange={() => handleSelect(t.id)} onClick={(e) => e.stopPropagation()} /></td>
            <td className="p-3 whitespace-nowrap">{formatDate(t.data)}</td>
            <td className="p-3"><div className="flex items-center space-x-2">{isTransfer && <span title={`Transferência ${isDebit ? 'para' : 'de'} ${transferAccountName}`}><ArrowRightLeft size={14} className="text-yellow-400 flex-shrink-0" /></span>}<span>{t.descricao}</span></div></td>
            <td className="p-3 flex items-center space-x-2">{categoria && getCategoryIcon(categoria.tipo)}<span>{categoria?.nome || 'N/A'}</span></td>
            <td className={`p-3 text-right font-semibold ${valorColor}`}>{formatCurrency(t.valor)}</td>
            <td className="p-3 text-center"><span className={`px-2 py-0.5 text-xs rounded-full ${t.realizado ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>{t.realizado ? 'Realizado' : 'Previsto'}</span></td>
            <td className="p-3 text-center flex justify-center space-x-3">
                <button onClick={(e) => { e.stopPropagation(); handleEditClick(t); }} className="text-gray-400 hover:text-blue-400"><Pencil size={16}/></button>
                <button onClick={(e) => { e.stopPropagation(); deleteTransacao(t.id); }} className="text-gray-400 hover:text-red-400"><Trash2 size={16}/></button>
            </td>
        </tr>
    );
  };

  return (
    <div className="animate-fade-in flex flex-col h-full md:flex-row md:space-x-6">
      {/* Sidebar */}
      <div className="w-full md:w-64 flex-shrink-0 mb-6 md:mb-0">
          <div className="hidden md:flex bg-gray-800 rounded-lg p-3 flex-col h-full">
              <div className="flex-grow space-y-2 overflow-y-auto no-scrollbar">
                  <button onClick={() => setSelectedView('all')} className={`w-full text-left p-3 rounded-lg flex justify-between items-center transition-colors ${selectedView === 'all' ? 'bg-green-500/80 text-white' : 'bg-gray-700/50 hover:bg-gray-700'}`}>
                      <span>Todas as Contas</span>
                      <span className="text-sm font-semibold">{formatCurrency(kpisData.saldoConsolidado)}</span>
                  </button>
                  <hr className="border-gray-700" />
                  {contasComSaldo.filter(c => c.ativo).sort((a,b) => a.nome.localeCompare(b.nome)).map(conta => (
                      <button key={conta.id} onClick={() => setSelectedView(conta.id)} className={`w-full text-left p-3 rounded-lg flex justify-between items-center transition-colors ${selectedView === conta.id ? 'bg-green-500/80 text-white' : 'bg-gray-700/50 hover:bg-gray-700'}`}>
                          <span className="truncate pr-2">{conta.nome}</span>
                          <span className="text-sm font-semibold">{formatCurrency(conta.saldoAtual)}</span>
                      </button>
                  ))}
              </div>
              <div className="pt-3 mt-auto border-t border-gray-700/50">
                  <button onClick={() => openModal('nova-conta')} className="w-full text-center p-2 rounded-lg flex items-center justify-center space-x-2 transition-colors bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white opacity-70 hover:opacity-100">
                      <Plus size={16} /><span>Nova Conta</span>
                  </button>
              </div>
          </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
          <DatePeriodSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
            <KPICard label="Saldo Consolidado" value={kpisData.saldoConsolidado} icon="bank" />
            <KPICard label="Entradas no Mês" value={kpisData.entradasMes} icon="up" />
            <KPICard label="Saídas no Mês" value={kpisData.saidasMes} icon="down" />
          </div>

          <div className="md:hidden mb-4">
              <MobileSelector
                  allLabel={`Todas as Contas (${formatCurrency(kpisData.saldoConsolidado)})`}
                  options={contasComSaldo.filter(c => c.ativo).sort((a,b) => a.nome.localeCompare(b.nome)).map(c => ({
                      value: c.id,
                      label: `${c.nome} (${formatCurrency(c.saldoAtual)})`
                  }))}
                  value={selectedView}
                  onChange={setSelectedView}
              />
          </div>

          <div className="flex-1 bg-gray-800 rounded-lg p-4 flex flex-col overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" placeholder="Pesquisar por descrição..." value={filters.textoFiltro} onChange={e => handleFilterChange('textoFiltro', e.target.value)} className="w-full bg-gray-700 p-2 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <select value={filters.categoriaFiltro} onChange={e => handleFilterChange('categoriaFiltro', e.target.value)} className="w-full bg-gray-700 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"><option value="">Todas as categorias</option>{categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
              <select value={filters.tipoFiltro} onChange={e => handleFilterChange('tipoFiltro', e.target.value)} className="w-full bg-gray-700 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"><option value="">Todos os tipos</option>{Object.values(TipoCategoria).map(t => <option key={t} value={t}>{t}</option>)}</select>
            </div>
            {(filters.categoriaFiltro || filters.tipoFiltro || filters.textoFiltro) && <button onClick={clearFilters} className="text-sm text-gray-400 flex items-center space-x-1 hover:text-white mb-2"><FilterX size={14} /><span>Limpar filtros</span></button>}
            
            {/* Desktop Table */}
            <div className="overflow-y-auto flex-grow hidden md:block">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-gray-800 z-10"><tr><th className="p-3 w-10 text-center"><input type="checkbox" className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-offset-gray-800 focus:ring-green-500" checked={isAllSelected} onChange={handleSelectAll} title={isAllSelected ? "Desmarcar todos" : "Marcar todos"}/></th><th className="p-3">Data</th><th className="p-3">Descrição</th><th className="p-3">Categoria</th><th className="p-3 text-right">Valor</th><th className="p-3 text-center">Status</th><th className="p-3 text-center">Ações</th></tr></thead>
                <tbody>{transacoesFiltradas.map(t => renderTransactionRow(t, false))}{transacoesFiltradas.length === 0 && (<tr><td colSpan={7} className="text-center text-gray-400 py-8">Nenhuma transação encontrada.</td></tr>)}</tbody>
              </table>
            </div>
             {/* Mobile List */}
            <div className="overflow-y-auto flex-grow md:hidden">
                {transacoesFiltradas.length > 0 ? transacoesFiltradas.map(t => renderTransactionRow(t, true)) : (<div className="text-center text-gray-400 py-8">Nenhuma transação encontrada.</div>)}
            </div>
          </div>
      </div>
      
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-gray-800 border-t border-gray-700 p-4 shadow-lg flex justify-between items-center z-20 animate-fade-in-up">
            <span className="text-white font-medium">{selectedIds.size} selecionada(s)</span>
            <div className="flex space-x-3">
                <button onClick={() => setIsMassEditModalOpen(true)} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors"><Pencil size={16} /><span>Alterar Categoria</span></button>
                <button onClick={() => { deleteTransacoes(Array.from(selectedIds)); setSelectedIds(new Set()); }} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors"><Trash2 size={16} /><span>Excluir</span></button>
            </div>
        </div>
      )}

      <Modal isOpen={isContaModalOpen} onClose={closeModal} title={editingConta ? 'Editar Conta' : 'Nova Conta'}><form onSubmit={handleContaSubmit} className="space-y-4"><input type="text" placeholder="Nome da Conta" value={contaForm.nome} onChange={e => setContaForm({...contaForm, nome: e.target.value})} required className="w-full bg-gray-700 p-2 rounded"/><div className="grid grid-cols-2 gap-4"><CurrencyInput placeholder="Saldo Inicial" value={contaForm.saldo_inicial} onValueChange={v => setContaForm({...contaForm, saldo_inicial: v})} required className="w-full bg-gray-700 p-2 rounded" disabled={isSaldoInicialEditBlocked}/><input type="date" value={contaForm.data_inicial} onChange={e => setContaForm({...contaForm, data_inicial: e.target.value})} required className="w-full bg-gray-700 p-2 rounded" disabled={isSaldoInicialEditBlocked} /></div>{isSaldoInicialEditBlocked && <small className="text-yellow-400 text-xs">Saldo e data inicial não podem ser alterados pois a conta já possui movimentações.</small>}<div className="flex items-center"><input type="checkbox" id="conta-ativa" checked={contaForm.ativo} onChange={e => setContaForm({...contaForm, ativo: e.target.checked})} className="h-4 w-4 rounded"/> <label htmlFor="conta-ativa" className="ml-2">Conta ativa</label></div><div className="pt-4 flex justify-end space-x-3"><button type="button" onClick={closeModal} className="bg-gray-600 px-4 py-2 rounded">Cancelar</button><button type="submit" className="bg-green-500 px-4 py-2 rounded">Salvar</button></div></form></Modal>
      <Modal isOpen={isMassEditModalOpen} onClose={() => setIsMassEditModalOpen(false)} title="Alterar Categoria em Massa" footer={<><button onClick={() => setIsMassEditModalOpen(false)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button><button onClick={handleConfirmMassEdit} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg" disabled={!massEditCategoryId}>Confirmar</button></>}><div className="space-y-4"><p className="text-gray-300">Selecione a nova categoria para as {selectedIds.size} transações selecionadas.</p><div><label htmlFor="mass-edit-category" className="block text-sm font-medium text-gray-300 mb-1">Nova Categoria</label><select id="mass-edit-category" value={massEditCategoryId} onChange={e => setMassEditCategoryId(e.target.value)} className="w-full bg-gray-700 p-2 rounded"><option value="" disabled>Selecione...</option>{categorias.filter(c => !c.sistema).map(c => (<option key={c.id} value={c.id}>{c.nome} ({c.tipo})</option>))}</select></div></div></Modal>
    </div>
  );
};

export default ContasExtratoPage;