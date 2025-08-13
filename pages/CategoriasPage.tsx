import React, { useState, useMemo, useEffect } from 'react';
import { Categoria, TransacaoBanco, TipoCategoria, CompraCartao, ModalState } from '../types';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { getCategoryIcon } from '../constants';
import { Plus, Pencil, Trash2, Lock } from 'lucide-react';

interface CategoriasPageProps {
  categorias: Categoria[];
  transacoes: TransacaoBanco[];
  compras: CompraCartao[];
  addCategoria: (categoria: Omit<Categoria, 'id' | 'createdAt' | 'updatedAt' | 'sistema'>) => void;
  updateCategoria: (categoria: Categoria) => void;
  deleteCategoria: (id: string) => void;
  modalState: ModalState;
  openModal: (modal: string, data?: any) => void;
  closeModal: () => void;
}

const CategoriasPage: React.FC<CategoriasPageProps> = ({ categorias, transacoes, compras, addCategoria, updateCategoria, deleteCategoria, modalState, openModal, closeModal }) => {
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);

  // Form state
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<TipoCategoria>(TipoCategoria.Saida);

  const isModalOpen = modalState.modal === 'nova-categoria' || modalState.modal === 'editar-categoria';
  
  const categoriasEmUso = useMemo(() => {
    const ids = new Set<string>();
    transacoes.forEach(t => ids.add(t.categoria_id));
    compras.forEach(c => ids.add(c.categoria_id));
    return ids;
  }, [transacoes, compras]);

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
      } else {
        setNome('');
        setTipo(TipoCategoria.Saida);
      }
    }
  }, [isModalOpen, modalState.data]);
  
  const handleOpenEditModal = (categoria: Categoria) => {
    openModal('editar-categoria', { categoria });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nome.trim() === '') {
      alert('O nome da categoria é obrigatório.');
      return;
    }

    const categoriaData = { nome: nome.trim(), tipo };
    
    if (editingCategoria) {
      updateCategoria({ ...editingCategoria, ...categoriaData });
    } else {
      addCategoria({ ...categoriaData });
    }
    
    closeModal();
  };

  const handleDelete = (categoriaId: string) => {
    deleteCategoria(categoriaId);
  };

  const renderCategoryItem = (categoria: Categoria) => {
    const isInUse = categoriasEmUso.has(categoria.id);
    const isProtected = categoria.sistema || isInUse;
    let deleteTooltip = "Excluir categoria";
    if (categoria.sistema) {
        deleteTooltip = "Categorias de sistema não podem ser excluídas.";
    } else if (isInUse) {
        deleteTooltip = "Esta categoria não pode ser excluída pois está em uso.";
    }

    return (
        <div key={categoria.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center space-x-3">
                {getCategoryIcon(categoria.tipo)}
                <span className="text-white">{categoria.nome}</span>
                {categoria.sistema && (
                  <span title="Categoria de sistema">
                    <Lock size={14} className="text-yellow-400" />
                  </span>
                )}
            </div>
            <div className="flex items-center space-x-4">
                <button 
                    onClick={() => handleOpenEditModal(categoria)} 
                    className="text-gray-400 hover:text-blue-400 transition-colors" 
                    aria-label={`Editar categoria ${categoria.nome}`}
                >
                    <Pencil size={18} />
                </button>
                <button 
                    onClick={() => handleDelete(categoria.id)} 
                    disabled={isProtected}
                    className={`transition-colors ${isProtected ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-red-400'}`}
                    title={deleteTooltip}
                    aria-label={`Excluir categoria ${categoria.nome}`}
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Categorias"
        description="Organize suas transações em entradas, saídas e investimentos."
        actionButton={
          <button onClick={() => openModal('nova-categoria')} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors">
            <Plus size={20} />
            <span>Nova Categoria</span>
          </button>
        }
      />
      
      <div className="space-y-8">
        {Object.values(TipoCategoria).map(tipo => {
          const cats = groupedCategorias[tipo];
          if (!cats || cats.length === 0) return null;
          
          return (
            <div key={tipo}>
              <h3 className="text-xl font-semibold text-white mb-4 border-b-2 border-gray-700 pb-2">{tipo}</h3>
              <div className="space-y-2">
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
        <form id="categoria-form" onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="nome-cat" className="block text-sm font-medium text-gray-300 mb-1">Nome da Categoria</label>
            <input
              type="text"
              id="nome-cat"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="tipo-cat" className="block text-sm font-medium text-gray-300 mb-1">Tipo</label>
            <select
              id="tipo-cat"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoCategoria)}
              disabled={!!editingCategoria}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {Object.values(TipoCategoria).map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
            {!!editingCategoria && (
                <p className="text-xs text-gray-400 mt-2">O tipo de uma categoria não pode ser alterado após a criação.</p>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CategoriasPage;