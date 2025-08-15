
import React, { useState, useMemo, useEffect } from 'react';
import { Categoria, TransacaoBanco, TipoCategoria, CompraCartao, ModalState, ParcelaCartao } from '../types';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { getCategoryIcon } from '../constants';
import { Plus, Pencil, Trash2, Lock } from 'lucide-react';
import DatePeriodSelector from '../components/DatePeriodSelector';
import CurrencyInput from '../components/CurrencyInput';
import { formatCurrency } from '../utils/format';

interface CategoriasPageProps {
  categorias: Categoria[];
  transacoes: TransacaoBanco[];
  compras: CompraCartao[];
  parcelas: ParcelaCartao[];
  addCategoria: (categoria: Omit<Categoria, 'id' | 'createdAt' | 'updatedAt' | 'sistema'>) => void;
  updateCategoria: (categoria: Categoria) => void;
  deleteCategoria: (id: string) => void;
  modalState: ModalState;
  openModal: (modal: string, data?: any) => void;
  closeModal: () => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

const CategoriasPage: React.FC<CategoriasPageProps> = ({ 
  categorias, transacoes, compras, parcelas, addCategoria, updateCategoria, deleteCategoria, 
  modalState, openModal, closeModal, selectedMonth, onMonthChange 
}) => {
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);

  // Form state
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<TipoCategoria>(TipoCategoria.Saida);
  const [orcamento, setOrcamento] = useState<string>('');

  const isModalOpen = modalState.modal === 'nova-categoria' || modalState.modal === 'editar-categoria';
  
  const gastosPorCategoria = useMemo(() => {
    const gastos: Record<string, number> = {};
    
    // Gastos no banco do mês
    transacoes
        .filter(t => t.realizado && t.tipo === TipoCategoria.Saida && t.data.startsWith(selectedMonth))
        .forEach(t => {
            gastos[t.categoria_id] = (gastos[t.categoria_id] || 0) + t.valor;
        });

    // Gastos no cartão de crédito (considerando parcelas da competência do mês)
    parcelas
      .filter(p => p.competencia_fatura === selectedMonth)
      .forEach(p => {
          const compra = compras.find(c => c.id === p.compra_id && !c.estorno);
          if (compra) {
              gastos[compra.categoria_id] = (gastos[compra.categoria_id] || 0) + p.valor_parcela;
          }
      });
      
    return gastos;
  }, [transacoes, compras, parcelas, selectedMonth]);

  const groupedCategorias = useMemo(() => {
    const groups: { [key in TipoCategoria]?: Categoria[] } = {};
    Object.values(TipoCategoria).forEach(t => groups[t] = []);

    categorias.forEach(cat => {
      if (groups[cat.tipo]) {
        groups[cat.tipo]!.push(cat);
      }
    });
    
    for (const key in groups) {
      groups[key as TipoCategoria]?.sort((a, b) => a.nome.localeCompare(b.nome));
    }
    return groups;
  }, [categorias]);
  
  useEffect(() => {
    if (isModalOpen) {
      const categoriaToEdit = modalState.data?.categoria as Categoria | null;
      setEditingCategoria(categoriaToEdit || null);
      if (categoriaToEdit) {
        setNome(categoriaToEdit.nome);
        setTipo(categoriaToEdit.tipo);
        setOrcamento(categoriaToEdit.orcamento_mensal ? String(categoriaToEdit.orcamento_mensal * 100) : '');
      } else {
        setNome('');
        setTipo(TipoCategoria.Saida);
        setOrcamento('');
      }
    }
  }, [isModalOpen, modalState.data]);
  
  const handleOpenEditModal = (categoria: Categoria) => {
    openModal('editar-categoria', { categoria });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nome.trim() === '') return;

    const categoriaData = { 
        nome: nome.trim(), 
        tipo,
        orcamento_mensal: orcamento ? parseFloat(orcamento) / 100 : null
    };
    
    if (editingCategoria) {
      updateCategoria({ ...editingCategoria, ...categoriaData });
    } else {
      addCategoria({ ...categoriaData });
    }
    
    closeModal();
  };

  const renderCategoryItem = (categoria: Categoria) => {
    const isProtected = categoria.sistema;
    const gasto = gastosPorCategoria[categoria.id] || 0;
    const orcamentoDefinido = categoria.orcamento_mensal && categoria.orcamento_mensal > 0;
    const progresso = orcamentoDefinido ? Math.min((gasto / categoria.orcamento_mensal!) * 100, 100) : 0;
    const progressoCor = progresso > 90 ? 'bg-red-500' : progresso > 75 ? 'bg-yellow-500' : 'bg-green-500';

    return (
        <div key={categoria.id} className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    {getCategoryIcon(categoria.tipo)}
                    <span className="text-white">{categoria.nome}</span>
                    {categoria.sistema && <span title="Categoria de sistema"><Lock size={14} className="text-yellow-400" /></span>}
                </div>
                <div className="flex items-center space-x-4">
                    <button onClick={() => handleOpenEditModal(categoria)} className="text-gray-400 hover:text-blue-400 transition-colors" aria-label={`Editar categoria ${categoria.nome}`}><Pencil size={18} /></button>
                    <button onClick={() => deleteCategoria(categoria.id)} disabled={isProtected} className={`transition-colors ${isProtected ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-red-400'}`} title={isProtected ? "Categorias de sistema não podem ser excluídas." : "Excluir"} aria-label={`Excluir categoria ${categoria.nome}`}><Trash2 size={18} /></button>
                </div>
            </div>
            {categoria.tipo === TipoCategoria.Saida && (
                <div className="mt-2">
                    {orcamentoDefinido ? (
                        <div>
                            <div className="flex justify-between text-xs text-gray-300 mb-1">
                                <span>{formatCurrency(gasto)}</span>
                                <span>{formatCurrency(categoria.orcamento_mensal!)}</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${progressoCor}`} style={{ width: `${progresso}%` }}></div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-xs text-gray-500">Sem orçamento definido</div>
                    )}
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="animate-fade-in">
        <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-2">Categorias e Orçamentos</h2>
        </div>
        <div className="flex justify-center mb-6">
            <DatePeriodSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} />
        </div>
        <div className="mb-6 flex justify-end">
          <button onClick={() => openModal('nova-categoria')} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors">
            <Plus size={20} />
            <span>Nova Categoria</span>
          </button>
        </div>
      
      <div className="space-y-8">
        {Object.values(TipoCategoria).map(tipo => {
          const cats = groupedCategorias[tipo];
          if (!cats || cats.length === 0) return null;
          
          return (
            <div key={tipo}>
              <h3 className="text-xl font-semibold text-white mb-4 border-b-2 border-gray-700 pb-2">{tipo}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cats.map(renderCategoryItem)}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingCategoria ? 'Editar Categoria' : 'Adicionar Nova Categoria'}
        footer={
          <>
            <button onClick={closeModal} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">Cancelar</button>
            <button type="submit" form="categoria-form" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">Salvar</button>
          </>
        }
      >
        <form id="categoria-form" onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="nome-cat" className="block text-sm font-medium text-gray-300 mb-1">Nome da Categoria</label>
              <input type="text" id="nome-cat" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500" required />
            </div>
            <div>
              <label htmlFor="tipo-cat" className="block text-sm font-medium text-gray-300 mb-1">Tipo</label>
              {editingCategoria ? (
                <input
                  id="tipo-cat"
                  type="text"
                  value={tipo}
                  readOnly
                  className="w-full bg-gray-600 border border-gray-600 rounded-lg px-3 py-2 text-gray-300 cursor-not-allowed focus:outline-none"
                />
              ) : (
                <select id="tipo-cat" value={tipo} onChange={(e) => setTipo(e.target.value as TipoCategoria)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                  {Object.values(TipoCategoria).filter(t => t !== TipoCategoria.Estorno).map(val => ( <option key={val} value={val}>{val}</option>))}
                </select>
              )}
            </div>
            {tipo === TipoCategoria.Saida && (
              <div>
                <label htmlFor="orcamento-cat" className="block text-sm font-medium text-gray-300 mb-1">Orçamento Mensal (Opcional)</label>
                <CurrencyInput value={orcamento} onValueChange={setOrcamento} placeholder="R$ 0,00" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"/>
              </div>
            )}
        </form>
      </Modal>
    </div>
  );
};

export default CategoriasPage;
