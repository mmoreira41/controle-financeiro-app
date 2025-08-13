import React, { useState, useMemo, useEffect } from 'react';
import { TransacaoBanco, ContaBancaria, Categoria, TipoCategoria } from '../types';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import CurrencyInput from '../components/CurrencyInput';
import { formatCurrency, formatDate } from '../utils/format';
import { Plus, Pencil, Trash2, FilterX, Search, ArrowRightLeft } from 'lucide-react';

interface TransacoesPageProps {
  transacoes: TransacaoBanco[];
  contas: ContaBancaria[];
  categorias: Categoria[];
  addTransacao: (transacao: Omit<TransacaoBanco, 'id' | 'createdAt' | 'updatedAt' | 'tipo'>) => boolean;
  updateTransacao: (transacao: TransacaoBanco) => void;
  deleteTransacao: (id: string) => void;
  deleteTransacoes: (ids: string[]) => void;
  handleTransferencia: (origemId: string, destinoId: string, valor: number, data: string, descricao: string) => void;
}

const getTodayString = () => new Date().toISOString().split('T')[0];

// Hook to manage state with localStorage persistence
const usePersistentState = <T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    try {
      const storedValue = localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
      console.error("Error reading from localStorage", error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error("Error writing to localStorage", error);
    }
  }, [key, state]);

  return [state, setState];
};


const TransacoesPage: React.FC<TransacoesPageProps> = ({ transacoes, contas, categorias, addTransacao, updateTransacao, deleteTransacao, deleteTransacoes, handleTransferencia }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingTransacao, setEditingTransacao] = useState<TransacaoBanco | null>(null);
  
  // Filters with persistence
  const [filters, setFilters] = usePersistentState('transacoesFilters', {
    startDate: '',
    endDate: '',
    contaFiltro: '',
    categoriaFiltro: '',
    tipoFiltro: '',
    textoFiltro: '',
  });

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Form State
  const [formState, setFormState] = useState({
    data: getTodayString(),
    conta_id: '',
    categoria_id: '',
    valor: '', // Raw numeric string for CurrencyInput
    descricao: '',
    previsto: false,
  });
  const [transferFormState, setTransferFormState] = useState({
    data: getTodayString(),
    origem_id: '',
    destino_id: '',
    valor: '', // Raw numeric string
    descricao: '',
  });
  const [formTipo, setFormTipo] = useState<TipoCategoria | ''>('');
  
  const filteredTransacoes = useMemo(() => {
    return transacoes
      .filter(t => !filters.startDate || t.data >= filters.startDate)
      .filter(t => !filters.endDate || t.data <= filters.endDate)
      .filter(t => !filters.contaFiltro || t.conta_id === filters.contaFiltro)
      .filter(t => !filters.categoriaFiltro || t.categoria_id === filters.categoriaFiltro)
      .filter(t => !filters.tipoFiltro || t.tipo === filters.tipoFiltro)
      .filter(t => !filters.textoFiltro || t.descricao.toLowerCase().includes(filters.textoFiltro.toLowerCase()))
      .sort((a, b) => b.data.localeCompare(a.data) || b.id.localeCompare(a.id));
  }, [transacoes, filters]);

  // Auto-check 'previsto' for future dates on new transactions
  useEffect(() => {
    if (!editingTransacao) { // Only for new transactions
        const today = getTodayString();
        if (formState.data > today) {
            setFormState(prev => ({ ...prev, previsto: true }));
        } else {
            setFormState(prev => ({ ...prev, previsto: false }));
        }
    }
  }, [formState.data, editingTransacao]);


  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };
  
  const clearFilters = () => {
    setFilters({ startDate: '', endDate: '', contaFiltro: '', categoriaFiltro: '', tipoFiltro: '', textoFiltro: '' });
  };

  const handleOpenModal = (transacao: TransacaoBanco | null = null) => {
    setEditingTransacao(transacao);
    if (transacao) {
      setFormState({
        data: transacao.data,
        conta_id: transacao.conta_id,
        categoria_id: transacao.categoria_id,
        valor: String(transacao.valor * 100), // to cents string
        descricao: transacao.descricao,
        previsto: transacao.previsto,
      });
      const cat = categorias.find(c => c.id === transacao.categoria_id);
      setFormTipo(cat?.tipo || '');
    } else {
      setFormState({
        data: getTodayString(),
        conta_id: contas.filter(c => c.ativo)[0]?.id || '',
        categoria_id: '',
        valor: '',
        descricao: '',
        previsto: false,
      });
      setFormTipo('');
    }
    setIsModalOpen(true);
  };
  
  const handleOpenTransferModal = () => {
     const activeContas = contas.filter(c => c.ativo);
     setTransferFormState({
        data: getTodayString(),
        origem_id: activeContas.length > 0 ? activeContas[0].id : '',
        destino_id: activeContas.length > 1 ? activeContas[1].id : '',
        valor: '',
        descricao: '',
    });
    setIsTransferModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);
  const handleCloseTransferModal = () => setIsTransferModalOpen(false);
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = (e.target as HTMLInputElement).checked;
    setFormState(prev => ({...prev, [name]: isCheckbox ? checked : value}));
  };
  
  const handleValueChange = (value: string) => {
    setFormState(prev => ({ ...prev, valor: value }));
  };
  
  const handleTransferValueChange = (value: string) => {
    setTransferFormState(prev => ({ ...prev, valor: value }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const catId = e.target.value;
    const cat = categorias.find(c => c.id === catId);
    setFormState(prev => ({ ...prev, categoria_id: catId }));
    setFormTipo(cat?.tipo || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.conta_id || !formState.categoria_id || !formState.valor) {
        alert('Preencha todos os campos obrigatórios: Conta, Categoria e Valor.');
        return;
    }

    const dataToSend = {
      ...formState,
      valor: parseFloat(formState.valor) / 100 || 0,
      descricao: formState.descricao.trim(),
      realizado: !formState.previsto,
    };

    if (editingTransacao) {
      updateTransacao({ ...editingTransacao, ...dataToSend });
    } else {
      addTransacao(dataToSend);
    }
    handleCloseModal();
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { origem_id, destino_id, valor, data, descricao } = transferFormState;
    if (!origem_id || !destino_id || !valor) {
        alert("Preencha todos os campos da transferência.");
        return;
    }
    if (origem_id === destino_id) {
        alert("A conta de origem e destino não podem ser a mesma.");
        return;
    }
    handleTransferencia(origem_id, destino_id, parseFloat(valor) / 100 || 0, data, descricao);
    handleCloseTransferModal();
  };
  
  const handleBulkDelete = () => {
    deleteTransacoes(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        return newSet;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredTransacoes.map(t => t.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const getContaName = (id: string) => contas.find(c => c.id === id)?.nome || 'Desconhecida';
  const getCategoriaName = (id: string) => categorias.find(c => c.id === id)?.nome || 'Desconhecida';

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Transações Bancárias"
        description="Visualize e gerencie todas as suas movimentações financeiras."
        actionButton={
          <div className="flex space-x-2">
            <button onClick={handleOpenTransferModal} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors">
              <ArrowRightLeft size={20} />
              <span>Nova Transferência</span>
            </button>
            <button onClick={() => handleOpenModal()} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors">
              <Plus size={20} />
              <span>Nova Transação</span>
            </button>
          </div>
        }
      />
      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input type="date" value={filters.startDate} onChange={e => handleFilterChange('startDate', e.target.value)} placeholder="Data Início" className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
            <input type="date" value={filters.endDate} onChange={e => handleFilterChange('endDate', e.target.value)} placeholder="Data Fim" className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
            <select value={filters.contaFiltro} onChange={e => handleFilterChange('contaFiltro', e.target.value)} className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Todas as Contas</option>
                {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            <select value={filters.categoriaFiltro} onChange={e => handleFilterChange('categoriaFiltro', e.target.value)} className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Todas as Categorias</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            <select value={filters.tipoFiltro} onChange={e => handleFilterChange('tipoFiltro', e.target.value)} className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Todos os Tipos</option>
                {Object.values(TipoCategoria).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="relative col-span-1 md:col-span-2 lg:col-span-2">
                 <input type="text" value={filters.textoFiltro} onChange={e => handleFilterChange('textoFiltro', e.target.value)} placeholder="Buscar por descrição..." className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
            </div>
            <button onClick={clearFilters} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors">
                <FilterX size={18} /><span>Limpar Filtros</span>
            </button>
        </div>
      </div>
      
      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-900/50 border border-blue-700 rounded-lg p-3 mb-6 flex justify-between items-center animate-fade-in">
            <span className="text-white">{selectedIds.size} transaçõ{selectedIds.size > 1 ? 'es' : 'ão'} selecionada{selectedIds.size > 1 ? 's' : ''}</span>
            <button onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg flex items-center space-x-2 text-sm">
                <Trash2 size={16} /><span>Excluir Selecionadas</span>
            </button>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="p-4 w-12"><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.size > 0 && selectedIds.size === filteredTransacoes.length} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 bg-gray-700" /></th>
                  <th className="p-4 font-semibold text-sm">Data</th>
                  <th className="p-4 font-semibold text-sm">Conta</th>
                  <th className="p-4 font-semibold text-sm">Categoria</th>
                  <th className="p-4 font-semibold text-sm">Descrição</th>
                  <th className="p-4 font-semibold text-sm text-right">Valor</th>
                  <th className="p-4 font-semibold text-sm text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransacoes.map((t) => (
                  <tr key={t.id} className={`border-t border-gray-700 ${selectedIds.has(t.id) ? 'bg-blue-900/30' : 'hover:bg-gray-700/50'}`}>
                    <td className="p-4"><input type="checkbox" checked={selectedIds.has(t.id)} onChange={() => handleSelect(t.id)} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 bg-gray-700" /></td>
                    <td className="p-4 text-sm">{formatDate(t.data)}</td>
                    <td className="p-4 text-sm">{getContaName(t.conta_id)}</td>
                    <td className="p-4 text-sm">{getCategoriaName(t.categoria_id)}</td>
                    <td className="p-4 text-sm">{t.descricao}</td>
                    <td className={`p-4 text-sm text-right font-semibold ${t.tipo === 'Entrada' ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(t.valor)}</td>
                    <td className="p-4 flex justify-center items-center space-x-4">
                      <button onClick={() => handleOpenModal(t)} className="text-gray-400 hover:text-blue-400"><Pencil size={18} /></button>
                      <button onClick={() => deleteTransacao(t.id)} className="text-gray-400 hover:text-red-400"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
                {filteredTransacoes.length === 0 && (
                    <tr className="border-t border-gray-700"><td colSpan={7} className="text-center text-gray-400 py-8">Nenhuma transação encontrada.</td></tr>
                )}
              </tbody>
            </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingTransacao ? 'Editar Transação' : 'Nova Transação'}>
        <form id="transacao-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Data</label>
                <input type="date" name="data" value={formState.data} onChange={handleFormChange} required className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Conta</label>
                <select name="conta_id" value={formState.conta_id} onChange={handleFormChange} required className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="" disabled>Selecione...</option>
                    {contas.filter(c => c.ativo).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Categoria</label>
                <select name="categoria_id" value={formState.categoria_id} onChange={handleCategoryChange} required className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="" disabled>Selecione...</option>
                    {categorias.filter(c => !c.sistema).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
            </div>
            {formTipo && <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tipo</label>
                <input type="text" value={formTipo} readOnly className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-gray-300 cursor-not-allowed"/>
            </div>}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Valor</label>
                <CurrencyInput value={formState.valor} onValueChange={handleValueChange} required placeholder="R$ 0,00" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Descrição</label>
                <input type="text" name="descricao" value={formState.descricao} onChange={handleFormChange} required maxLength={200} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"/>
            </div>
            <div className="flex items-center">
                <input type="checkbox" name="previsto" checked={formState.previsto} onChange={handleFormChange} id="previsto-check" className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 bg-gray-700"/>
                <label htmlFor="previsto-check" className="ml-3 block text-sm text-gray-300">Marcar como Previsto (não realizado)</label>
            </div>
            <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={handleCloseModal} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">Salvar</button>
            </div>
        </form>
      </Modal>

      <Modal isOpen={isTransferModalOpen} onClose={handleCloseTransferModal} title="Nova Transferência entre Contas">
        <form id="transfer-form" onSubmit={handleTransferSubmit} className="space-y-4">
            <input type="date" value={transferFormState.data} onChange={e => setTransferFormState({...transferFormState, data: e.target.value})} required className="w-full bg-gray-700 p-2 rounded"/>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">De</label>
                <select value={transferFormState.origem_id} onChange={e => setTransferFormState({...transferFormState, origem_id: e.target.value})} required className="w-full bg-gray-700 p-2 rounded">
                    {contas.filter(c => c.ativo).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Para</label>
                <select value={transferFormState.destino_id} onChange={e => setTransferFormState({...transferFormState, destino_id: e.target.value})} required className="w-full bg-gray-700 p-2 rounded">
                    {contas.filter(c => c.ativo && c.id !== transferFormState.origem_id).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Valor</label>
                <CurrencyInput value={transferFormState.valor} onValueChange={handleTransferValueChange} required placeholder="R$ 0,00" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"/>
            </div>
            <input type="text" placeholder="Descrição (opcional)" value={transferFormState.descricao} onChange={e => setTransferFormState({...transferFormState, descricao: e.target.value})} className="w-full bg-gray-700 p-2 rounded"/>

            <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={handleCloseTransferModal} className="bg-gray-600 px-4 py-2 rounded">Cancelar</button>
                <button type="submit" className="bg-blue-500 px-4 py-2 rounded">Confirmar Transferência</button>
            </div>
        </form>
      </Modal>

    </div>
  );
};

export default TransacoesPage;