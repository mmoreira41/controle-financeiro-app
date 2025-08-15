
import React, { useState, useMemo, useEffect } from 'react';
import { Meta, ModalState, TransacaoBanco, TipoCategoria, ContaBancaria } from '../types';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, PiggyBank } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/format';
import CurrencyInput from '../components/CurrencyInput';

interface MetasPageProps {
  metas: Meta[];
  transacoes: TransacaoBanco[];
  contas: ContaBancaria[];
  addMeta: (meta: Omit<Meta, 'id' | 'categoria_id' | 'createdAt' | 'updatedAt'>) => void;
  updateMeta: (meta: Meta) => void;
  deleteMeta: (id: string) => void;
  adicionarDinheiroMeta: (metaId: string, contaId: string, valor: number, data: string) => boolean;
  modalState: ModalState;
  openModal: (modal: string, data?: any) => void;
  closeModal: () => void;
}

const getTodayString = () => new Date().toISOString().split('T')[0];

const MetasPage: React.FC<MetasPageProps> = ({ metas, transacoes, contas, addMeta, updateMeta, deleteMeta, adicionarDinheiroMeta, modalState, openModal, closeModal }) => {
  const [editingMeta, setEditingMeta] = useState<Meta | null>(null);
  const [formState, setFormState] = useState({ nome: '', valor_meta: '', data_meta: '' });
  
  const [investimentoMeta, setInvestimentoMeta] = useState<Meta | null>(null);
  const [investimentoForm, setInvestimentoForm] = useState({ conta_id: '', valor: '', data: getTodayString() });

  const isModalOpen = modalState.modal === 'nova-meta' || modalState.modal === 'editar-meta';
  const isInvestimentoModalOpen = !!investimentoMeta;

  useEffect(() => {
    if (isModalOpen) {
      const metaToEdit = modalState.data?.meta as Meta | null;
      setEditingMeta(metaToEdit || null);
      if (metaToEdit) {
        setFormState({
          nome: metaToEdit.nome,
          valor_meta: String(metaToEdit.valor_meta * 100),
          data_meta: metaToEdit.data_meta,
        });
      } else {
        setFormState({ nome: '', valor_meta: '', data_meta: getTodayString() });
      }
    }
  }, [isModalOpen, modalState.data]);

  const valorAtualPorMeta = useMemo(() => {
    const valores: Record<string, number> = {};
    metas.forEach(meta => {
      valores[meta.id] = transacoes
        .filter(t => t.categoria_id === meta.categoria_id && t.tipo === TipoCategoria.Investimento && t.realizado)
        .reduce((sum, t) => sum + t.valor, 0);
    });
    return valores;
  }, [metas, transacoes]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.nome || !formState.valor_meta || !formState.data_meta) return;

    const data = {
      nome: formState.nome,
      valor_meta: parseFloat(formState.valor_meta) / 100,
      data_meta: formState.data_meta,
    };

    if (editingMeta) {
      updateMeta({ ...editingMeta, ...data });
    } else {
      addMeta(data);
    }
    closeModal();
  };

  const handleOpenInvestimentoModal = (meta: Meta) => {
    setInvestimentoMeta(meta);
    const defaultConta = contas.find(c => c.ativo);
    setInvestimentoForm({
        conta_id: defaultConta?.id || '',
        valor: '',
        data: getTodayString()
    });
  };

  const handleCloseInvestimentoModal = () => {
      setInvestimentoMeta(null);
  };
    
  const handleInvestimentoSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!investimentoMeta || !investimentoForm.conta_id || !investimentoForm.valor || !investimentoForm.data) return;

      const valorNumerico = parseFloat(investimentoForm.valor) / 100;
      if (valorNumerico <= 0) return;

      const success = adicionarDinheiroMeta(
          investimentoMeta.id,
          investimentoForm.conta_id,
          valorNumerico,
          investimentoForm.data
      );
      
      if (success) {
          handleCloseInvestimentoModal();
      }
  };
  
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Metas de Economia"
        description="Defina e acompanhe seus objetivos financeiros."
        actionButton={
          <button onClick={() => openModal('nova-meta')} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2">
            <Plus size={20} />
            <span>Nova Meta</span>
          </button>
        }
      />

      {metas.length === 0 ? (
          <div className="text-center bg-gray-800 rounded-lg p-12 mt-6">
              <p className="text-gray-400">Nenhuma meta cadastrada ainda.</p>
              <p className="text-gray-500 text-sm mt-2">Clique em "Nova Meta" para começar a planejar seu futuro!</p>
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metas.map(meta => {
            const valorAtual = valorAtualPorMeta[meta.id] || 0;
            const progresso = meta.valor_meta > 0 ? Math.min((valorAtual / meta.valor_meta) * 100, 100) : 0;
            return (
              <div key={meta.id} className="bg-gray-800 p-5 rounded-lg shadow-lg flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-white">{meta.nome}</h3>
                  <div className="flex space-x-3">
                    <button onClick={() => openModal('editar-meta', { meta })} className="text-gray-400 hover:text-blue-400"><Pencil size={16} /></button>
                    <button onClick={() => deleteMeta(meta.id)} className="text-gray-400 hover:text-red-400"><Trash2 size={16} /></button>
                  </div>
                </div>

                <div className="flex justify-between items-end mb-1">
                  <span className="text-2xl font-extrabold text-green-400">{formatCurrency(valorAtual)}</span>
                  <span className="text-sm text-gray-400"> de {formatCurrency(meta.valor_meta)}</span>
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-2.5 mb-3">
                  <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${progresso}%` }}></div>
                </div>

                <button 
                  onClick={() => handleOpenInvestimentoModal(meta)}
                  className="w-full flex items-center justify-center space-x-2 bg-green-600/50 hover:bg-green-600 text-white font-bold py-2 px-4 my-3 rounded-lg transition-colors"
                >
                    <PiggyBank size={20} />
                    <span>Adicionar Dinheiro</span>
                </button>
                
                <div className="flex justify-between text-xs text-gray-400 mt-auto">
                  <span>{Math.floor(progresso)}% completo</span>
                  <span>Meta até: {formatDate(meta.data_meta)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingMeta ? 'Editar Meta' : 'Criar Nova Meta'}
        footer={
          <>
            <button onClick={closeModal} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
            <button type="submit" form="meta-form" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">Salvar</button>
          </>
        }
      >
        <form id="meta-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nome-meta" className="block text-sm font-medium text-gray-300 mb-1">Nome da Meta</label>
            <input id="nome-meta" type="text" value={formState.nome} onChange={e => setFormState({...formState, nome: e.target.value})} className="w-full bg-gray-700 p-2 rounded" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="valor-meta" className="block text-sm font-medium text-gray-300 mb-1">Valor Alvo</label>
              <CurrencyInput id="valor-meta" value={formState.valor_meta} onValueChange={v => setFormState({...formState, valor_meta: v})} className="w-full bg-gray-700 p-2 rounded" placeholder="R$ 0,00" required />
            </div>
            <div>
              <label htmlFor="data-meta" className="block text-sm font-medium text-gray-300 mb-1">Data Alvo</label>
              <input id="data-meta" type="date" value={formState.data_meta} onChange={e => setFormState({...formState, data_meta: e.target.value})} className="w-full bg-gray-700 p-2 rounded" min={getTodayString()} required />
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isInvestimentoModalOpen}
        onClose={handleCloseInvestimentoModal}
        title={`Adicionar Dinheiro à Meta: ${investimentoMeta?.nome}`}
        footer={
          <>
            <button onClick={handleCloseInvestimentoModal} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
            <button type="submit" form="investimento-form" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">Confirmar Investimento</button>
          </>
        }
      >
        <form id="investimento-form" onSubmit={handleInvestimentoSubmit} className="space-y-4">
          <div>
            <label htmlFor="conta-investimento" className="block text-sm font-medium text-gray-300 mb-1">Conta de Origem</label>
            <select id="conta-investimento" value={investimentoForm.conta_id} onChange={e => setInvestimentoForm({...investimentoForm, conta_id: e.target.value})} className="w-full bg-gray-700 p-2 rounded" required>
                <option value="" disabled>Selecione a conta...</option>
                {contas.filter(c => c.ativo).map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="valor-investimento" className="block text-sm font-medium text-gray-300 mb-1">Valor do Investimento</label>
              <CurrencyInput id="valor-investimento" value={investimentoForm.valor} onValueChange={v => setInvestimentoForm({...investimentoForm, valor: v})} className="w-full bg-gray-700 p-2 rounded" placeholder="R$ 0,00" required />
            </div>
            <div>
              <label htmlFor="data-investimento" className="block text-sm font-medium text-gray-300 mb-1">Data</label>
              <input id="data-investimento" type="date" value={investimentoForm.data} onChange={e => setInvestimentoForm({...investimentoForm, data: e.target.value})} className="w-full bg-gray-700 p-2 rounded" required />
            </div>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default MetasPage;
