
import React, { useState, useMemo, useEffect } from 'react';
import { ObjetivoInvestimento, ModalState, TransacaoBanco, TipoCategoria, ContaBancaria } from '../types';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, PiggyBank } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/format';
import CurrencyInput from '../components/CurrencyInput';

interface InvestimentosPageProps {
  objetivos: ObjetivoInvestimento[];
  transacoes: TransacaoBanco[];
  contas: ContaBancaria[];
  addObjetivo: (objetivo: Omit<ObjetivoInvestimento, 'id' | 'categoria_id' | 'createdAt' | 'updatedAt'>) => void;
  updateObjetivo: (objetivo: ObjetivoInvestimento) => void;
  deleteObjetivo: (id: string) => void;
  adicionarDinheiroObjetivo: (objetivoId: string, contaId: string, valor: number, data: string) => boolean;
  modalState: ModalState;
  openModal: (modal: string, data?: any) => void;
  closeModal: () => void;
}

const getTodayString = () => new Date().toISOString().split('T')[0];

const InvestimentosPage: React.FC<InvestimentosPageProps> = ({ objetivos, transacoes, contas, addObjetivo, updateObjetivo, deleteObjetivo, adicionarDinheiroObjetivo, modalState, openModal, closeModal }) => {
  const [editingObjetivo, setEditingObjetivo] = useState<ObjetivoInvestimento | null>(null);
  const [formState, setFormState] = useState({ nome: '', valor_meta: '', data_meta: '' });
  
  const [investimentoObjetivo, setInvestimentoObjetivo] = useState<ObjetivoInvestimento | null>(null);
  const [investimentoForm, setInvestimentoForm] = useState({ conta_id: '', valor: '', data: getTodayString() });

  const isModalOpen = modalState.modal === 'novo-objetivo' || modalState.modal === 'editar-objetivo';
  const isInvestimentoModalOpen = !!investimentoObjetivo;

  useEffect(() => {
    if (isModalOpen) {
      const objetivoToEdit = modalState.data?.objetivo as ObjetivoInvestimento | null;
      setEditingObjetivo(objetivoToEdit || null);
      if (objetivoToEdit) {
        setFormState({
          nome: objetivoToEdit.nome,
          valor_meta: String(objetivoToEdit.valor_meta * 100),
          data_meta: objetivoToEdit.data_meta,
        });
      } else {
        setFormState({ nome: '', valor_meta: '', data_meta: getTodayString() });
      }
    }
  }, [isModalOpen, modalState.data]);

  const { featuredObjetivo, otherObjetivos } = useMemo(() => {
    if (objetivos.length === 0) {
        return { featuredObjetivo: null, otherObjetivos: [] };
    }
    const objetivosComProgresso = objetivos.map(objetivo => {
      const valorAtual = transacoes
        .filter(t => t.categoria_id === objetivo.categoria_id && t.tipo === TipoCategoria.Investimento && t.realizado)
        .reduce((sum, t) => sum + t.valor, 0);
      const progresso = objetivo.valor_meta > 0 ? (valorAtual / objetivo.valor_meta) : 0;
      return { ...objetivo, valorAtual, progresso };
    }).sort((a, b) => b.progresso - a.progresso);

    return {
      featuredObjetivo: objetivosComProgresso[0],
      otherObjetivos: objetivosComProgresso.slice(1),
    };
  }, [objetivos, transacoes]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.nome || !formState.valor_meta || !formState.data_meta) return;

    const data = {
      nome: formState.nome,
      valor_meta: parseFloat(formState.valor_meta) / 100,
      data_meta: formState.data_meta,
    };

    if (editingObjetivo) {
      updateObjetivo({ ...editingObjetivo, ...data });
    } else {
      addObjetivo(data);
    }
    closeModal();
  };

  const handleOpenInvestimentoModal = (objetivo: ObjetivoInvestimento) => {
    setInvestimentoObjetivo(objetivo);
    const defaultConta = contas.find(c => c.ativo);
    setInvestimentoForm({
        conta_id: defaultConta?.id || '',
        valor: '',
        data: getTodayString()
    });
  };

  const handleCloseInvestimentoModal = () => {
      setInvestimentoObjetivo(null);
  };
    
  const handleInvestimentoSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!investimentoObjetivo || !investimentoForm.conta_id || !investimentoForm.valor || !investimentoForm.data) return;

      const valorNumerico = parseFloat(investimentoForm.valor) / 100;
      if (valorNumerico <= 0) return;

      const success = adicionarDinheiroObjetivo(
          investimentoObjetivo.id,
          investimentoForm.conta_id,
          valorNumerico,
          investimentoForm.data
      );
      
      if (success) {
          handleCloseInvestimentoModal();
      }
  };
  
  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-3xl font-bold text-white">Investimentos</h2>
            <p className="text-gray-400 mt-1">Acompanhe seus objetivos financeiros.</p>
        </div>
        <button onClick={() => openModal('novo-objetivo')} className="bg-lime-400 hover:bg-lime-500 text-black font-bold py-2 px-4 rounded-lg flex items-center space-x-2">
            <Plus size={20} />
            <span>Novo Objetivo</span>
        </button>
      </div>

      {objetivos.length === 0 ? (
          <div className="text-center bg-gray-800 rounded-lg p-12 mt-6">
              <p className="text-gray-400">Nenhum objetivo cadastrado ainda.</p>
              <p className="text-gray-500 text-sm mt-2">Clique em "Novo Objetivo" para começar a planejar seu futuro!</p>
          </div>
      ) : (
        <>
        {featuredObjetivo && (
            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg flex flex-col">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-white">{featuredObjetivo.nome}</h3>
                    <div className="flex space-x-3">
                        <button onClick={() => openModal('editar-objetivo', { objetivo: featuredObjetivo })} className="text-gray-400 hover:text-blue-400"><Pencil size={18} /></button>
                        <button onClick={() => deleteObjetivo(featuredObjetivo.id)} className="text-gray-400 hover:text-red-400"><Trash2 size={18} /></button>
                    </div>
                </div>
                <div className="text-3xl font-extrabold text-white mb-2">{formatCurrency(featuredObjetivo.valorAtual)}</div>
                <div className="flex justify-between items-end mb-1 text-sm">
                    <span className="text-gray-400">Meta: {formatCurrency(featuredObjetivo.valor_meta)}</span>
                    <span className="font-semibold text-lime-400">{Math.floor(featuredObjetivo.progresso * 100)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
                    <div className="bg-lime-400 h-2.5 rounded-full" style={{ width: `${featuredObjetivo.progresso * 100}%` }}></div>
                </div>
                <button 
                    onClick={() => handleOpenInvestimentoModal(featuredObjetivo)}
                    className="w-full bg-lime-400 hover:bg-lime-500 text-black font-bold py-3 px-4 rounded-lg transition-colors"
                >
                    Adicionar Dinheiro
                </button>
            </div>
        )}
        
        {otherObjetivos.length > 0 && (
            <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-4">Outros Objetivos</h3>
                <div className="space-y-4">
                {otherObjetivos.map(objetivo => (
                    <div key={objetivo.id} className="bg-gray-800 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-white">{objetivo.nome}</span>
                            <div className="flex space-x-3">
                                <button onClick={() => handleOpenInvestimentoModal(objetivo)} className="text-lime-400 hover:text-lime-300"><Plus size={16} /></button>
                                <button onClick={() => openModal('editar-objetivo', { objetivo })} className="text-gray-400 hover:text-blue-400"><Pencil size={16} /></button>
                                <button onClick={() => deleteObjetivo(objetivo.id)} className="text-gray-400 hover:text-red-400"><Trash2 size={16} /></button>
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                            <span>{formatCurrency(objetivo.valorAtual)} / {formatCurrency(objetivo.valor_meta)}</span>
                            <span>{Math.floor(objetivo.progresso * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5">
                            <div className="bg-lime-400 h-1.5 rounded-full" style={{ width: `${objetivo.progresso * 100}%` }}></div>
                        </div>
                    </div>
                ))}
                </div>
            </div>
        )}
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingObjetivo ? 'Editar Objetivo' : 'Criar Novo Objetivo'}
        footer={
          <>
            <button onClick={closeModal} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
            <button type="submit" form="objetivo-form" className="bg-lime-400 hover:bg-lime-500 text-black font-bold py-2 px-4 rounded-lg">Salvar</button>
          </>
        }
      >
        <form id="objetivo-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nome-objetivo" className="block text-sm font-medium text-gray-300 mb-1">Nome do Objetivo</label>
            <input id="nome-objetivo" type="text" value={formState.nome} onChange={e => setFormState({...formState, nome: e.target.value})} className="w-full bg-gray-700 p-2 rounded" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="valor-objetivo" className="block text-sm font-medium text-gray-300 mb-1">Valor Alvo</label>
              <CurrencyInput id="valor-objetivo" value={formState.valor_meta} onValueChange={v => setFormState({...formState, valor_meta: v})} className="w-full bg-gray-700 p-2 rounded" placeholder="R$ 0,00" required />
            </div>
            <div>
              <label htmlFor="data-objetivo" className="block text-sm font-medium text-gray-300 mb-1">Data Alvo</label>
              <input id="data-objetivo" type="date" value={formState.data_meta} onChange={e => setFormState({...formState, data_meta: e.target.value})} className="w-full bg-gray-700 p-2 rounded" min={getTodayString()} required />
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isInvestimentoModalOpen}
        onClose={handleCloseInvestimentoModal}
        title={`Adicionar Dinheiro: ${investimentoObjetivo?.nome}`}
        footer={
          <>
            <button onClick={handleCloseInvestimentoModal} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
            <button type="submit" form="investimento-form" className="bg-lime-400 hover:bg-lime-500 text-black font-bold py-2 px-4 rounded-lg">Confirmar</button>
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

export default InvestimentosPage;