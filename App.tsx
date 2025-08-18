import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AlertTriangle, Info, ChevronDown } from 'lucide-react';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import ContasExtratoPage from './pages/ContasExtratoPage';
import FluxoCaixaPage from './pages/FluxoCaixaPage';
import CartoesPage from './pages/CartoesPage';
import ResumoPage from './pages/ResumoPage';
import InvestimentosPage from './pages/InvestimentosPage';
import PerfilPage from './pages/PerfilPage';
import CalculadoraJurosCompostosPage from './pages/CalculadoraJurosCompostosPage';
import CalculadoraReservaEmergenciaPage from './pages/CalculadoraReservaEmergenciaPage';
import Toast from './components/Toast';
import ConfirmationModal, { ConfirmationModalData } from './components/ConfirmationModal';
import Modal from './components/Modal';
import CurrencyInput from './components/CurrencyInput';
import ImageCropModal from './components/ImageCropModal';
import SearchModal from './components/SearchModal';

import { Page, ContaBancaria, TransacaoBanco, Cartao, Categoria, CompraCartao, ParcelaCartao, TipoCategoria, ModalState, NavigationState, ObjetivoInvestimento, Settings } from './types';
import { CATEGORIAS_PADRAO, CORES_CARTAO } from './constants';
import { formatCurrency, computeFirstCompetency, addMonths, ymToISOFirstDay, splitInstallments, parseBrDate, parseCurrency, formatDate, calculateSaldo } from './utils/format';
import { useAuth } from './src/contexts/AuthContext';
import { useTransacoes } from './src/hooks/useTransacoes';
import { useContas } from './src/hooks/useContas';
import { useCategorias } from './src/hooks/useCategorias';


type CsvTransaction = { data: string; descricao: string; valor: number; originalLine: string };
type CsvImportRow = CsvTransaction & {
    selected: boolean;
    isDuplicate: boolean;
};
type CsvImportState = {
    transactions: CsvImportRow[];
    fileName: string;
    detectedInitialBalance?: { date: string; value: number };
    detectedFinalBalance?: number;
} | null;

// Custom hook for persisting state to localStorage
function usePersistentState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key “${key}”:`, error);
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            const serializedState = JSON.stringify(state);
            window.localStorage.setItem(key, serializedState);
        } catch (error) {
            console.error(`Error setting localStorage key “${key}”:`, error);
        }
    }, [key, state]);

    return [state, setState];
}


const App: React.FC = () => {
  // 🔧 CORREÇÃO CRÍTICA: Usar hooks do Supabase em vez de localStorage
  const { user } = useAuth();
  const { 
    transacoes, 
    loading: transacoesLoading, 
    addTransacao, 
    updateTransacao, 
    deleteTransacao,
    createTransferencia,
    toggleRealizado
  } = useTransacoes();
  const { 
    contas, 
    loading: contasLoading, 
    addConta, 
    updateConta, 
    deleteConta 
  } = useContas();
  const { 
    categorias, 
    loading: categoriasLoading, 
    addCategoria, 
    updateCategoria, 
    deleteCategoria 
  } = useCategorias();

  const [currentPage, setCurrentPage] = useState<Page>('resumo');
  const [selectedViewId, setSelectedViewId] = useState<'all' | string>('all');
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [navigationState, setNavigationState] = useState<NavigationState | null>(null);

  // Feedback System State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationModalData | null>(null);
  const [modalState, setModalState] = useState<ModalState>({ modal: null, data: null });
  
  const getTodayString = () => new Date().toISOString().split('T')[0];

  // 🔧 VERIFICAÇÃO: Apenas mostrar dados se usuário está logado
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  // 🔧 DADOS AINDA EM LOCALSTORAGE (conversão futura):
  const [cartoes, setCartoes] = usePersistentState<Cartao[]>('cartoes', []);
  const [compras, setCompras] = usePersistentState<CompraCartao[]>('compras', []);
  const [parcelas, setParcelas] = usePersistentState<ParcelaCartao[]>('parcelas', []);
  const [objetivos, setObjetivos] = usePersistentState<ObjetivoInvestimento[]>('objetivos', []);
  const [profilePicture, setProfilePicture] = usePersistentState<string | null>('profilePicture', null);
  const [settings, setSettings] = usePersistentState<Settings>('settings', { showPercentageChange: false });
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  const [csvImportState, setCsvImportState] = useState<CsvImportState>(null);
  const [csvDestinoConta, setCsvDestinoConta] = useState<string>('');
  const [csvNewAccountName, setCsvNewAccountName] = useState('');

  // States for Global Modals
  const [transacaoForm, setTransacaoForm] = useState({ data: getTodayString(), conta_id: '', categoria_id: '', valor: '', descricao: '', previsto: false, recorrencia: null as TransacaoBanco['recorrencia'] });
  const [transferenciaForm, setTransferenciaForm] = useState({ data: getTodayString(), origem_id: '', destino_id: '', valor: '', descricao: '' });
  const [compraForm, setCompraForm] = useState({ data_compra: getTodayString(), valor_total: '', categoria_id: '', descricao: '', estorno: false, cartao_id: '', parcelas: 1 });
  const [editingCompra, setEditingCompra] = useState<CompraCartao | null>(null);
  
  const [isSaldoInicialEditBlocked, setSaldoInicialEditBlocked] = useState(false);

  // Search state
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const isTransacaoModalOpen = modalState.modal === 'nova-transacao' || modalState.modal === 'editar-transacao';
  const isTransferModalOpen = modalState.modal === 'nova-transferencia' || modalState.modal === 'editar-transferencia';
  const isCompraModalOpen = modalState.modal === 'nova-compra-cartao' || modalState.modal === 'editar-compra-cartao';
  
  const openModal = (modal: string, data?: any) => setModalState({ modal, data });
  const closeModal = () => setModalState({ modal: null, data: null });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      setToast({ message, type });
  };
  
  // Recurring Transactions Logic
  useEffect(() => {
    const lastCheck = localStorage.getItem('lastRecurringCheck');
    const todayStr = new Date().toISOString().slice(0, 10);
    // Avoid running on every hot-reload in dev, run once per day in prod.
    if (lastCheck === todayStr && process.env.NODE_ENV !== 'development') {
        return;
    }

    const now = new Date();
    const newTransactions: TransacaoBanco[] = [];
    const uniqueRecorrenciaIds = [...new Set(transacoes.map(t => t.recorrencia_id).filter(Boolean))];

    uniqueRecorrenciaIds.forEach(recorrenciaId => {
        const group = transacoes.filter(t => t.recorrencia_id === recorrenciaId);
        const template = group.find(t => t.recorrencia); // The one with the rule
        const lastInstance = group.reduce((latest, current) => new Date(latest.data) > new Date(current.data) ? latest : current);
        
        if (!template) return;

        let nextDate = new Date(`${lastInstance.data}T12:00:00Z`);

        const advanceDate = () => {
            switch(template.recorrencia) {
                case 'diario': nextDate.setUTCDate(nextDate.getUTCDate() + 1); break;
                case 'semanal': nextDate.setUTCDate(nextDate.getUTCDate() + 7); break;
                case 'mensal': {
                    const currentMonth = nextDate.getUTCMonth();
                    nextDate.setUTCMonth(currentMonth + 1);
                    // If the month rolls over incorrectly (e.g., Jan 31 -> Mar 3), set to last day of correct next month
                    if (nextDate.getUTCMonth() !== (currentMonth + 1) % 12 && nextDate.getUTCMonth() !== 0) {
                        nextDate.setUTCDate(0);
                    }
                    break;
                }
                case 'anual': nextDate.setUTCFullYear(nextDate.getUTCFullYear() + 1); break;
            }
        };

        advanceDate(); // Move to the next potential date

        while (nextDate <= now) {
            newTransactions.push({
                ...template,
                id: crypto.randomUUID(),
                data: nextDate.toISOString().slice(0, 10),
                recorrencia: null, // Generated instances are not templates
                previsto: true,
                realizado: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
            advanceDate();
        }
    });

    if (newTransactions.length > 0) {
        setTransacoes(prev => [...prev, ...newTransactions]);
        showToast(`${newTransactions.length} transações recorrentes foram criadas.`, 'info');
    }

    localStorage.setItem('lastRecurringCheck', todayStr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run on mount

  // Handlers Contas
  const handleAddConta = (contaData: { nome: string; saldo_inicial: number; ativo: boolean; data_inicial: string; cor: string; }): ContaBancaria | null => {
    if (contas.some(c => c.nome.toLowerCase() === contaData.nome.toLowerCase())) {
        showToast("Já existe uma conta com esse nome.", 'error');
        return null;
    }
    const categoriaSaldoInicial = categorias.find(c => c.nome === "Saldo Inicial" && c.sistema);
    if (!categoriaSaldoInicial) {
        showToast("Categoria 'Saldo Inicial' de sistema não encontrada.", 'error');
        return null;
    }

    const agora = new Date().toISOString();
    const novaConta: ContaBancaria = {
        id: crypto.randomUUID(),
        nome: contaData.nome,
        saldo_inicial: 0, // Saldo inicial é sempre 0 na conta
        data_inicial: contaData.data_inicial,
        ativo: contaData.ativo,
        cor: contaData.cor || CORES_CARTAO[0].value,
        createdAt: agora,
        updatedAt: agora
    };
    
    const transacaoSaldoInicial: TransacaoBanco = {
        id: crypto.randomUUID(),
        conta_id: novaConta.id,
        data: contaData.data_inicial,
        valor: contaData.saldo_inicial,
        categoria_id: categoriaSaldoInicial.id,
        tipo: categoriaSaldoInicial.tipo,
        descricao: 'Saldo inicial da conta',
        previsto: false,
        realizado: true,
        meta_saldo_inicial: true,
        createdAt: agora,
        updatedAt: agora,
    };

    setContas(prev => [...prev, novaConta]);
    setTransacoes(prev => [...prev, transacaoSaldoInicial]);
    showToast("Conta criada com sucesso.");
    return novaConta;
  };

  const handleUpdateConta = (contaAtualizada: Omit<ContaBancaria, 'saldo_inicial'>, novoSaldoInicial: number, novaDataInicial: string) => {
      const contaOriginal = contas.find(c => c.id === contaAtualizada.id);
      const transacaoSaldoInicialOriginal = transacoes.find(t => t.conta_id === contaAtualizada.id && t.meta_saldo_inicial);
      if (!contaOriginal || !transacaoSaldoInicialOriginal) return;

      const saldoMudou = transacaoSaldoInicialOriginal.valor !== novoSaldoInicial;
      const dataMudou = transacaoSaldoInicialOriginal.data !== novaDataInicial;

      if (saldoMudou || dataMudou) {
          const outrasTransacoes = transacoes.some(t => t.conta_id === contaAtualizada.id && !t.meta_saldo_inicial);
          if (outrasTransacoes) {
              setConfirmation({
                  title: "Ação Bloqueada",
                  message: "Ajuste de saldo inicial bloqueado: a conta já possui lançamentos. Use uma transação de ajuste.",
                  buttons: [{ label: 'Entendi', onClick: () => setConfirmation(null), style: 'primary' }]
              });
              return;
          }
          // Se não há outras transações, atualiza a transação de saldo inicial
          const transacaoSaldoAtualizada = {
              ...transacaoSaldoInicialOriginal,
              data: novaDataInicial,
              valor: novoSaldoInicial,
              updatedAt: new Date().toISOString(),
          };
          setTransacoes(prev => prev.map(t => t.id === transacaoSaldoInicialOriginal.id ? transacaoSaldoAtualizada : t));
      }

      const contaFinal = { ...contaOriginal, ...contaAtualizada, data_inicial: novaDataInicial, updatedAt: new Date().toISOString() };
      setContas(prev => prev.map(c => c.id === contaAtualizada.id ? contaFinal : c));
      showToast("Alterações salvas com sucesso.");
  };


  const handleDeleteConta = (contaId: string) => {
      const conta = contas.find(c => c.id === contaId);
      if (!conta) return;
      
      const transacoesDaConta = transacoes.filter(t => t.conta_id === contaId);
      if (transacoesDaConta.length > 1) { // Allow deletion if only initial balance exists
          setConfirmation({
              title: "Exclusão Bloqueada",
              message: `Não é possível excluir "${conta.nome}" porque existem lançamentos. Exclua os lançamentos antes de remover a conta.`,
              buttons: [{ label: 'Entendi', onClick: () => setConfirmation(null), style: 'primary' }]
          });
          return;
      }
      
      setConfirmation({
          title: "Confirmar Exclusão",
          message: `Tem certeza que deseja excluir "${conta.nome}"? Esta ação não pode ser desfeita.`,
          buttons: [
              { label: 'Cancelar', onClick: () => setConfirmation(null), style: 'secondary' },
              { label: 'Excluir', onClick: () => {
                  setContas(prev => prev.filter(c => c.id !== contaId));
                  // Também remove a transação de saldo inicial, se houver
                  setTransacoes(prev => prev.filter(t => t.conta_id !== contaId));
                  setConfirmation(null);
                  showToast("Registro excluído com sucesso.");
                  if(selectedViewId === contaId) setSelectedViewId('all');
              }, style: 'danger' },
          ]
      });
  };
  
  // Handlers Categorias
  const handleAddCategoria = (novaCat: Omit<Categoria, 'id'|'createdAt'|'updatedAt'|'sistema'>) => {
    const agora = new Date().toISOString();
    const categoriaComId: Categoria = { ...novaCat, id: crypto.randomUUID(), sistema: false, createdAt: agora, updatedAt: agora };
    setCategorias(prev => [...prev, categoriaComId]);
    showToast("Categoria adicionada com sucesso.");
  };

  const handleUpdateCategoria = (catAtualizada: Categoria) => {
      const catOriginal = categorias.find(c => c.id === catAtualizada.id);
      if (!catOriginal) return;
      if(catOriginal.sistema && catOriginal.tipo !== catAtualizada.tipo) {
        setConfirmation({
            title: "Categoria Protegida",
            message: `A categoria "${catOriginal.nome}" faz parte do sistema e não pode ser excluída ou ter seu tipo alterado.`,
            buttons: [{ label: 'Entendi', onClick: () => setConfirmation(null), style: 'primary' }]
        });
        return;
      }
      const dataToUpdate = { ...catOriginal, nome: catAtualizada.nome, tipo: catAtualizada.tipo, orcamento_mensal: catAtualizada.orcamento_mensal, updatedAt: new Date().toISOString() };
      setCategorias(prev => prev.map(c => (c.id === catAtualizada.id ? dataToUpdate : c)));
      showToast("Alterações salvas com sucesso.");
  };

  const handleDeleteCategoria = (catId: string) => {
    const cat = categorias.find(c => c.id === catId);
    if (!cat) return;
    if (cat.sistema) { 
        setConfirmation({
            title: "Categoria Protegida",
            message: `A categoria "${cat.nome}" faz parte do sistema e não pode ser excluída ou ter seu tipo alterado.`,
            buttons: [{ label: 'Entendi', onClick: () => setConfirmation(null), style: 'primary' }]
        });
        return;
    }
    if (transacoes.some(t => t.categoria_id === catId) || compras.some(c => c.categoria_id === catId)) {
        setConfirmation({
            title: "Exclusão Bloqueada",
            message: `Não é possível excluir "${cat.nome}" porque existem registros vinculados. Migre ou remova os registros antes de tentar novamente.`,
            buttons: [{ label: 'Entendi', onClick: () => setConfirmation(null), style: 'primary' }]
        });
       return; 
    }
    setConfirmation({
        title: "Confirmar Exclusão",
        message: `Tem certeza que deseja excluir "${cat.nome}"? Esta ação não pode ser desfeita.`,
        buttons: [
            { label: 'Cancelar', onClick: () => setConfirmation(null), style: 'secondary' },
            { label: 'Excluir', onClick: () => {
                setCategorias(prev => prev.filter(c => c.id !== catId));
                setConfirmation(null);
                showToast("Registro excluído com sucesso.");
            }, style: 'danger' }
        ]
    });
  };

  // Handlers Transacoes
  const handleAddTransacao = (novaTransacao: Omit<TransacaoBanco, 'id'|'createdAt'|'updatedAt'|'tipo'>): boolean => {
    const categoria = categorias.find(c => c.id === novaTransacao.categoria_id);
    if (!categoria) {
      showToast("Categoria não encontrada!", 'error');
      return false;
    }
    
    if (categoria.tipo === TipoCategoria.Transferencia) {
        showToast("Use o botão de transferência para registrar esse tipo de movimento.", 'error');
        return false;
    }

    const criarTransacao = () => {
        const agora = new Date().toISOString();
        const transacaoComId: TransacaoBanco = {
            ...novaTransacao,
            id: crypto.randomUUID(),
            tipo: categoria.tipo,
            descricao: novaTransacao.descricao.trim().substring(0, 200),
            recorrencia_id: novaTransacao.recorrencia ? crypto.randomUUID() : null, // Set group ID if it's a new recurring tx
            createdAt: agora,
            updatedAt: agora,
        };
        setTransacoes(prev => [...prev, transacaoComId]);
        showToast("Transação registrada com sucesso.");
        if (confirmation) setConfirmation(null);
        return true;
    };

    const duplicata = transacoes.find(t => 
        t.data === novaTransacao.data &&
        t.conta_id === novaTransacao.conta_id &&
        t.valor === novaTransacao.valor &&
        t.descricao.toLowerCase() === novaTransacao.descricao.toLowerCase()
    );

    if (duplicata) {
        setConfirmation({
            title: "Transação Similar Encontrada",
            message: "Uma transação muito parecida já existe. Deseja adicionar mesmo assim?",
            buttons: [
                { label: 'Cancelar', onClick: () => setConfirmation(null), style: 'secondary' },
                { label: 'Adicionar Mesmo Assim', onClick: criarTransacao, style: 'primary' }
            ]
        });
        return false; // Wait for user confirmation
    }

    return criarTransacao();
  };

    const handleUpdateTransacao = (transacaoAtualizada: TransacaoBanco): boolean => {
        const original = transacoes.find(t => t.id === transacaoAtualizada.id);
        if (!original) return false;

        // Rule: Saldo Inicial
        if (original.meta_saldo_inicial) {
            const outrasTransacoes = transacoes.some(t => t.conta_id === original.conta_id && !t.meta_saldo_inicial);
            const dataMudou = original.data !== transacaoAtualizada.data;
            const valorMudou = original.valor !== transacaoAtualizada.valor;

            if ((dataMudou || valorMudou) && outrasTransacoes) {
                setConfirmation({
                    title: "Ação Bloqueada",
                    message: "Ajuste de saldo inicial bloqueado: a conta já possui lançamentos. Use uma transação de ajuste.",
                    buttons: [{ label: 'Entendi', onClick: () => setConfirmation(null), style: 'primary' }]
                });
                return false;
            }
        }
        
        const categoria = categorias.find(c => c.id === transacaoAtualizada.categoria_id);
        if (!categoria) { showToast("Categoria não encontrada!", 'error'); return false; }

        // Rule: Cannot change normal transaction to Transfer
        if (categoria.tipo === TipoCategoria.Transferencia && !original.meta_pagamento && !original.meta_saldo_inicial) {
            setConfirmation({
                title: "Ação Bloqueada",
                message: "Use o botão de transferência para registrar esse tipo de movimento.",
                buttons: [{ label: 'Entendi', onClick: () => setConfirmation(null), style: 'primary' }]
            });
            return false;
        }

        // Rule: Pagamento de Fatura propagation (if it has a pair)
        if (original.meta_pagamento && original.transferencia_par_id) {
            const par = transacoes.find(t => t.id === original.transferencia_par_id);
            if (par) {
                const parAtualizado = { ...par, data: transacaoAtualizada.data, valor: transacaoAtualizada.valor, descricao: transacaoAtualizada.descricao, updatedAt: new Date().toISOString() };
                setTransacoes(prev => prev.map(t => t.id === par.id ? parAtualizado : t));
            }
        }

        setTransacoes(prev => prev.map(t => t.id === transacaoAtualizada.id ? {
            ...transacaoAtualizada,
            tipo: categoria.tipo,
            descricao: transacaoAtualizada.descricao.trim().substring(0, 200),
            updatedAt: new Date().toISOString()
        } : t));

        showToast("Alterações salvas com sucesso.");
        return true;
    };

    const handleToggleTransactionRealizado = (transacaoId: string) => {
        const transacao = transacoes.find(t => t.id === transacaoId);
        if (transacao && !transacao.realizado) {
            const updatedTx = { ...transacao, realizado: true, previsto: false, updatedAt: new Date().toISOString() };
            setTransacoes(prev => prev.map(t => t.id === transacaoId ? updatedTx : t));
            showToast(`"${transacao.descricao}" marcada como realizada.`, 'success');
        }
    };

    const handleUpdateTransferencia = (transacaoId: string, origemId: string, destinoId: string, valor: number, data: string, descricao: string): boolean => {
        const original = transacoes.find(t => t.id === transacaoId);
        if (!original || !original.transferencia_par_id) return false;

        const par = transacoes.find(p => p.id === original.transferencia_par_id);
        if (!par) return false;

        const agora = new Date().toISOString();
        const desc = descricao || 'Transferência';

        // Figure out which leg is which based on old IDs to preserve the pairing
        const [origemLeg, destinoLeg] = original.id < par.id ? [original, par] : [par, original];
        
        const transacaoSaida: TransacaoBanco = {
            ...origemLeg,
            conta_id: origemId, data, valor, descricao: desc, updatedAt: agora
        };
        const transacaoEntrada: TransacaoBanco = {
            ...destinoLeg,
            conta_id: destinoId, data, valor, descricao: desc, updatedAt: agora
        };

        setTransacoes(prev => prev.map(t => {
            if (t.id === transacaoSaida.id) return transacaoSaida;
            if (t.id === transacaoEntrada.id) return transacaoEntrada;
            return t;
        }));

        showToast("Transferência atualizada.");
        return true;
    };
  
  const handleDeleteTransacao = (transacaoId: string) => {
      const transacao = transacoes.find(t => t.id === transacaoId);
      if (!transacao) return;

      // Rule: Transferência
      if (transacao.transferencia_par_id && !transacao.meta_pagamento) {
          const parId = transacao.transferencia_par_id;
          setConfirmation({
              title: "Confirmar Exclusão de Transferência",
              message: "Esta é uma transferência. A exclusão removerá ambas as transações vinculadas. Deseja continuar?",
              buttons: [
                  { label: 'Cancelar', onClick: () => setConfirmation(null), style: 'secondary' },
                  { label: 'Excluir', onClick: () => {
                      setTransacoes(prev => prev.filter(t => t.id !== transacaoId && t.id !== parId));
                      setConfirmation(null);
                      showToast("Transferência excluída.");
                  }, style: 'danger' }
              ]
          });
          return;
      }

      // Rule: Saldo Inicial
      if (transacao.meta_saldo_inicial) {
          const outrasTransacoes = transacoes.some(t => t.conta_id === transacao.conta_id && !t.meta_saldo_inicial);
          if (outrasTransacoes) {
              setConfirmation({
                  title: "Ação Bloqueada",
                  message: "Não é possível remover o saldo inicial: a conta já possui outros lançamentos.",
                  buttons: [{ label: 'Entendi', onClick: () => setConfirmation(null), style: 'primary' }]
              });
              return;
          }
      }

      // Default Case: Normal Transaction, Pagamento de Fatura, or deletable Saldo Inicial
      setConfirmation({
          title: "Confirmar Exclusão",
          message: `Tem certeza que deseja excluir "${transacao.descricao}"? Esta ação não pode ser desfeita.`,
          buttons: [
              { label: 'Cancelar', onClick: () => setConfirmation(null), style: 'secondary' },
              { label: 'Excluir', onClick: () => {
                  let idsToRemove = new Set([transacaoId]);
                  if (transacao.transferencia_par_id) { // For Pagamento de Fatura with a pair
                      idsToRemove.add(transacao.transferencia_par_id);
                  }
                  setTransacoes(prev => prev.filter(t => !idsToRemove.has(t.id)));
                  setConfirmation(null);
                  showToast(transacao.meta_pagamento ? "Pagamento removido." : "Registro excluído.");
              }, style: 'danger' }
          ]
      });
  };

  const handleDeleteTransacoes = (ids: string[]) => {
     let idsToDelete = new Set<string>();
     ids.forEach(id => {
         const t = transacoes.find(tx => tx.id === id);
         if (t) {
             idsToDelete.add(t.id);
             if (t.transferencia_par_id) {
                 idsToDelete.add(t.transferencia_par_id);
             }
         }
     });

     setConfirmation({
        title: "Confirmar Exclusão",
        message: `Tem certeza que deseja excluir ${idsToDelete.size} transações (incluindo pernas de transferências)?`,
        buttons: [
            { label: 'Cancelar', onClick: () => setConfirmation(null), style: 'secondary' },
            { label: 'Excluir', onClick: () => {
                setTransacoes(prev => prev.filter(t => !idsToDelete.has(t.id)));
                setConfirmation(null);
                showToast("Registros excluídos com sucesso.");
              }, style: 'danger' }
        ]
    });
  };
  
    const handleMassCategoryUpdate = (ids: string[], newCategoryId: string) => {
        const newCategory = categorias.find(c => c.id === newCategoryId);
        if (!newCategory) {
            showToast("Categoria de destino não encontrada.", "error");
            return;
        }

        setTransacoes(prev => prev.map(t => {
            if (ids.includes(t.id)) {
                return {
                    ...t,
                    categoria_id: newCategoryId,
                    tipo: newCategory.tipo,
                    updatedAt: new Date().toISOString(),
                };
            }
            return t;
        }));
        showToast(`${ids.length} transações atualizadas com sucesso.`);
    };

  const handleTransferencia = (origemId: string, destinoId: string, valor: number, data: string, descricao: string): boolean => {
    const categoriaTransf = categorias.find(c => c.nome === "Transferência" && c.sistema);
    if (!categoriaTransf) {
        showToast("Categoria 'Transferência' de sistema não encontrada.", 'error');
        return false;
    }
    if (origemId === destinoId) {
        showToast("Contas de origem e destino devem ser diferentes.", 'error');
        return false;
    }

    const agora = new Date().toISOString();
    const idSaida = crypto.randomUUID();
    const idEntrada = crypto.randomUUID();
    const desc = descricao || 'Transferência';
    
    const transacaoSaida: TransacaoBanco = {
        id: idSaida, conta_id: origemId, data, valor,
        categoria_id: categoriaTransf.id, tipo: TipoCategoria.Transferencia,
        descricao: desc,
        transferencia_par_id: idEntrada, previsto: false, realizado: true, createdAt: agora, updatedAt: agora,
    };
    
    const transacaoEntrada: TransacaoBanco = {
        id: idEntrada, conta_id: destinoId, data, valor,
        categoria_id: categoriaTransf.id, tipo: TipoCategoria.Transferencia,
        descricao: desc,
        transferencia_par_id: idSaida, previsto: false, realizado: true, createdAt: agora, updatedAt: agora,
    };
    
    setTransacoes(prev => [...prev, transacaoSaida, transacaoEntrada]);
    showToast("Transferência registrada com sucesso.");
    return true;
  };

  // Handlers Cartões
    const handleAddCartao = (novoCartao: Omit<Cartao, 'id' | 'createdAt' | 'updatedAt'>) => {
        const agora = new Date().toISOString();
        const cartaoComId: Cartao = { ...novoCartao, id: crypto.randomUUID(), createdAt: agora, updatedAt: agora };
        setCartoes(prev => [...prev, cartaoComId]);
        showToast("Cartão adicionado com sucesso.");
    };

    const handleUpdateCartao = (cartaoAtualizado: Cartao) => {
        setCartoes(prev => prev.map(c => c.id === cartaoAtualizado.id ? { ...cartaoAtualizado, updatedAt: new Date().toISOString() } : c));
        showToast("Alterações salvas com sucesso.");
    };

    const handleDeleteCartao = (cartaoId: string) => {
        const cartao = cartoes.find(c => c.id === cartaoId);
        if (!cartao) return;
        if (compras.some(c => c.cartao_id === cartaoId)) {
            setConfirmation({
                title: "Exclusão Bloqueada",
                message: `Não é possível excluir "${cartao.apelido}" porque existem registros vinculados. Migre ou remova os registros antes de tentar novamente.`,
                buttons: [{ label: 'Entendi', onClick: () => setConfirmation(null), style: 'primary' }]
            });
            return;
        }
        setConfirmation({
            title: "Confirmar Exclusão",
            message: `Tem certeza que deseja excluir "${cartao.apelido}"? Esta ação não pode ser desfeita.`,
            buttons: [
                { label: 'Cancelar', onClick: () => setConfirmation(null), style: 'secondary' },
                { label: 'Excluir', onClick: () => {
                    setCartoes(prev => prev.filter(c => c.id !== cartaoId));
                    setConfirmation(null);
                    showToast("Registro excluído com sucesso.");
                }, style: 'danger' }
            ]
        });
    };
    
    const generateParcelas = (compra: CompraCartao, cartao: Cartao): ParcelaCartao[] => {
        const agora = new Date().toISOString();
        const valorFinal = compra.estorno ? -compra.valor_total : compra.valor_total;
        
        const valoresParcelas = splitInstallments(valorFinal, compra.parcelas_total);

        const dataCompra = new Date(`${compra.data_compra}T12:00:00Z`);
        const { year: startYear, month: startMonth } = computeFirstCompetency(dataCompra, cartao.dia_fechamento);

        const novasParcelas: ParcelaCartao[] = [];
        for (let i = 0; i < compra.parcelas_total; i++) {
            const { year: competenciaYear, month: competenciaMonth } = addMonths(startYear, startMonth, i);
            const competencia_fatura = ymToISOFirstDay(competenciaYear, competenciaMonth).slice(0, 7);

            novasParcelas.push({
                id: crypto.randomUUID(),
                compra_id: compra.id,
                n_parcela: i + 1,
                valor_parcela: valoresParcelas[i],
                competencia_fatura,
                createdAt: agora,
                updatedAt: agora,
            });
        }
        return novasParcelas;
    };

    const handleAddCompraCartao = (compra: Omit<CompraCartao, 'id' | 'createdAt' | 'updatedAt'>): boolean => {
        const agora = new Date().toISOString();
        const novaCompra: CompraCartao = { ...compra, id: crypto.randomUUID(), createdAt: agora, updatedAt: agora };
        const cartao = cartoes.find(c => c.id === compra.cartao_id);
        if (!cartao) { showToast("Cartão não encontrado.", 'error'); return false; }
        const novasParcelas = generateParcelas(novaCompra, cartao);
        setCompras(prev => [...prev, novaCompra]);
        setParcelas(prev => [...prev, ...novasParcelas]);
        showToast("Compra adicionada com sucesso.");
        return true;
    };

    const handleUpdateCompraCartao = (compraAtualizada: CompraCartao): boolean => {
        const cartao = cartoes.find(c => c.id === compraAtualizada.cartao_id);
        if (!cartao) return false;
        const novasParcelas = generateParcelas(compraAtualizada, cartao);
        setCompras(prev => prev.map(c => c.id === compraAtualizada.id ? { ...compraAtualizada, updatedAt: new Date().toISOString() } : c));
        setParcelas(prev => [...prev.filter(p => p.compra_id !== compraAtualizada.id), ...novasParcelas]);
        showToast("Alterações aplicadas e propagadas com sucesso.");
        return true;
    };

    const handleDeleteCompraCartao = (compraId: string) => {
        const compra = compras.find(c => c.id === compraId);
        if (!compra) return;
        setConfirmation({
            title: "Confirmar Exclusão",
            message: `Tem certeza que deseja excluir "${compra.descricao}"? Todas as suas parcelas também serão removidas.`,
            buttons: [
                { label: 'Cancelar', onClick: () => setConfirmation(null), style: 'secondary' },
                { label: 'Excluir', onClick: () => {
                    setCompras(prev => prev.filter(c => c.id !== compraId));
                    setParcelas(prev => prev.filter(p => p.compra_id !== compraId));
                    setConfirmation(null);
                    showToast("Registro excluído com sucesso.");
                }, style: 'danger' }
            ]
        });
    };

    const handlePagarFatura = (cartaoId: string, contaId: string, valor: number, data: string, competenciaFatura: string) => {
        const cartao = cartoes.find(c => c.id === cartaoId);
        if (!cartao) { showToast("Cartão não encontrado.", 'error'); return; }

        const parcelasDaFatura = parcelas.filter(p => {
            const compra = compras.find(c => c.id === p.compra_id);
            return compra?.cartao_id === cartaoId && p.competencia_fatura === competenciaFatura;
        });
        const totalFatura = parcelasDaFatura.reduce((sum, p) => sum + p.valor_parcela, 0);

        const pagamentosAnteriores = transacoes.filter(t =>
            t.meta_pagamento &&
            t.cartao_id === cartaoId &&
            t.competencia_fatura === competenciaFatura
        );
        const totalPago = pagamentosAnteriores.reduce((sum, p) => sum + p.valor, 0);
        const restante = totalFatura - totalPago;

        if (valor > restante + 0.01) {
             setConfirmation({
                title: "Valor Inválido",
                message: `O valor a pagar (${formatCurrency(valor)}) não pode ser maior que o valor restante da fatura (${formatCurrency(restante)}).`,
                buttons: [{ label: 'Entendi', onClick: () => setConfirmation(null), style: 'primary' }]
            });
            return;
        }

        const categoriaPagamento = categorias.find(c => c.nome === "Pagamento de Cartão" && c.sistema);
        if (!categoriaPagamento) { showToast("Categoria 'Pagamento de Cartão' não encontrada.", 'error'); return; }

        const agora = new Date().toISOString();
        const transacaoPagamento: TransacaoBanco = {
            id: crypto.randomUUID(),
            conta_id: contaId,
            data,
            valor,
            categoria_id: categoriaPagamento.id,
            tipo: categoriaPagamento.tipo,
            descricao: `Pagamento fatura ${cartao.apelido} (${competenciaFatura.substring(5, 7)}/${competenciaFatura.substring(0, 4)})`,
            previsto: false,
            realizado: true,
            cartao_id: cartaoId,
            competencia_fatura: competenciaFatura,
            meta_pagamento: true,
            createdAt: agora,
            updatedAt: agora,
        };
        
        setTransacoes(prev => [...prev, transacaoPagamento]);
        
        const novoRestante = restante - valor;
        if (novoRestante <= 0.01) {
            showToast("Fatura paga. Status: Paga.");
        } else {
            showToast(`Pagamento registrado. Restante: ${formatCurrency(novoRestante)}`);
        }
    };

  // Handlers Objetivos
    const handleAddObjetivo = (objetivoData: Omit<ObjetivoInvestimento, 'id' | 'categoria_id' | 'createdAt' | 'updatedAt'>) => {
        const agora = new Date().toISOString();
        const novaCategoriaInvestimento: Categoria = {
            id: crypto.randomUUID(),
            nome: `Objetivo: ${objetivoData.nome}`,
            tipo: TipoCategoria.Investimento,
            sistema: true, // Mark as system-managed category tied to a goal
            createdAt: agora,
            updatedAt: agora,
        };
        const novoObjetivo: ObjetivoInvestimento = {
            ...objetivoData,
            id: crypto.randomUUID(),
            categoria_id: novaCategoriaInvestimento.id,
            createdAt: agora,
            updatedAt: agora,
        };

        setCategorias(prev => [...prev, novaCategoriaInvestimento]);
        setObjetivos(prev => [...prev, novoObjetivo]);
        showToast(`Objetivo "${objetivoData.nome}" criado com sucesso.`);
    };

    const handleUpdateObjetivo = (objetivoAtualizado: ObjetivoInvestimento) => {
        setObjetivos(prev => prev.map(m => m.id === objetivoAtualizado.id ? { ...objetivoAtualizado, updatedAt: new Date().toISOString() } : m));
        // Also update the associated category name if the goal name changed
        const categoriaAssociada = categorias.find(c => c.id === objetivoAtualizado.categoria_id);
        if (categoriaAssociada && categoriaAssociada.nome !== `Objetivo: ${objetivoAtualizado.nome}`) {
            const categoriaAtualizada = { ...categoriaAssociada, nome: `Objetivo: ${objetivoAtualizado.nome}`, updatedAt: new Date().toISOString() };
            setCategorias(prev => prev.map(c => c.id === categoriaAssociada.id ? categoriaAtualizada : c));
        }
        showToast("Objetivo atualizado com sucesso.");
    };

    const handleDeleteObjetivo = (objetivoId: string) => {
        const objetivo = objetivos.find(m => m.id === objetivoId);
        if (!objetivo) return;

        const transacoesNaMeta = transacoes.some(t => t.categoria_id === objetivo.categoria_id);
        if (transacoesNaMeta) {
            setConfirmation({
                title: "Exclusão Bloqueada",
                message: `Não é possível excluir o objetivo "${objetivo.nome}" porque existem investimentos associados a ele. Exclua as transações de investimento primeiro.`,
                buttons: [{ label: 'Entendi', onClick: () => setConfirmation(null), style: 'primary' }]
            });
            return;
        }

        setConfirmation({
            title: "Confirmar Exclusão",
            message: `Tem certeza que deseja excluir o objetivo "${objetivo.nome}"? A categoria de investimento associada também será removida.`,
            buttons: [
                { label: 'Cancelar', onClick: () => setConfirmation(null), style: 'secondary' },
                {
                    label: 'Excluir', onClick: () => {
                        setObjetivos(prev => prev.filter(m => m.id !== objetivoId));
                        setCategorias(prev => prev.filter(c => c.id !== objetivo.categoria_id));
                        setConfirmation(null);
                        showToast("Objetivo excluído com sucesso.");
                    }, style: 'danger'
                }
            ]
        });
    };

    const handleAdicionarDinheiroObjetivo = (objetivoId: string, contaId: string, valor: number, data: string): boolean => {
        const objetivo = objetivos.find(m => m.id === objetivoId);
        if (!objetivo) {
            showToast("Objetivo não encontrado.", "error");
            return false;
        }

        const contaOrigem = contas.find(c => c.id === contaId);
        if (!contaOrigem) {
            showToast("Conta de origem não encontrada.", "error");
            return false;
        }

        const saldoAtual = calculateSaldo(contaId, transacoes);
        if (saldoAtual < valor) {
            setConfirmation({
                title: "Saldo Insuficiente",
                message: (
                    <div className="text-left space-y-2">
                        <p>A conta <strong className="text-white">"{contaOrigem.nome}"</strong> não possui saldo suficiente para este investimento.</p>
                        <ul className="list-disc list-inside bg-gray-700/50 p-3 rounded-md text-sm">
                            <li>Saldo Atual: <strong className="text-green-400">{formatCurrency(saldoAtual)}</strong></li>
                            <li>Valor do Investimento: <strong className="text-red-400">{formatCurrency(valor)}</strong></li>
                        </ul>
                        <p>Para continuar, transfira o valor necessário ou escolha outra conta com saldo disponível.</p>
                    </div>
                ),
                buttons: [{ label: 'Entendi', onClick: () => setConfirmation(null), style: 'primary' }]
            });
            return false;
        }
    
        const categoria = categorias.find(c => c.id === objetivo.categoria_id);
        if (!categoria || categoria.tipo !== TipoCategoria.Investimento) {
            showToast("Categoria de investimento do objetivo é inválida.", "error");
            return false;
        }
        
        const transacaoData = {
            conta_id: contaId,
            data,
            valor,
            categoria_id: objetivo.categoria_id,
            descricao: `Investimento para objetivo: ${objetivo.nome}`,
            previsto: false,
            realizado: true,
            tipo: categoria.tipo,
        };
        
        const agora = new Date().toISOString();
        const transacaoComId: TransacaoBanco = {
            ...transacaoData,
            id: crypto.randomUUID(),
            createdAt: agora,
            updatedAt: agora,
        };
        setTransacoes(prev => [...prev, transacaoComId]);
        showToast(`Investimento para "${objetivo.nome}" registrado com sucesso.`);
        return true;
    };

    // Handlers Configurações
    const handleDeleteAllData = () => {
        setConfirmation({
            title: "APAGAR TODOS OS DADOS",
            message: "Esta ação é irreversível e removerá todas as contas, cartões, transações, objetivos e configurações. Tem certeza absoluta?",
            buttons: [
                { label: 'Cancelar', onClick: () => setConfirmation(null), style: 'secondary' },
                {
                    label: 'Sim, apagar tudo', onClick: () => {
                        // Clear localStorage by removing the keys
                        localStorage.removeItem('contas');
                        localStorage.removeItem('transacoes');
                        localStorage.removeItem('cartoes');
                        localStorage.removeItem('compras');
                        localStorage.removeItem('parcelas');
                        localStorage.removeItem('objetivos');
                        localStorage.removeItem('categorias');
                        localStorage.removeItem('profilePicture');
                        localStorage.removeItem('settings');
                        
                        // Reset state to initial values
                        setContas(initialContas);
                        setTransacoes(initialTransacoes);
                        setCartoes([]);
                        setCompras([]);
                        setParcelas([]);
                        setObjetivos([]);
                        setCategorias(CATEGORIAS_PADRAO);
                        setProfilePicture(null);
                        setSettings({ showPercentageChange: false });
                        
                        setConfirmation(null);
                        showToast("Todos os dados foram apagados.", "info");
                        setCurrentPage('resumo');
                    }, style: 'danger'
                }
            ]
        });
    };

    const handleExportData = () => {
        const data = {
            contas,
            transacoes,
            cartoes,
            compras,
            parcelas,
            objetivos,
            categorias,
            profilePicture,
            settings,
        };
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
        const link = document.createElement("a");
        link.href = jsonString;
        const date = new Date().toISOString().slice(0, 10);
        link.download = `lovable-financas-backup-${date}.json`;
        link.click();
        showToast("Dados exportados com sucesso.");
    };
    
    type InterParserResult = {
        summary: {
            account?: string;
            period?: string;
            finalBalance?: number;
        };
        transactions: CsvTransaction[];
        warnings: string[];
    }
    
    const parseBancoInterStatement = (content: string): InterParserResult => {
        const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    
        if (!lines.slice(0, 5).some(l => l.replace(/^\uFEFF/, '').includes('Extrato Conta Corrente'))) {
            throw new Error("Não é um extrato do Banco Inter (falta o marcador 'Extrato Conta Corrente').");
        }
    
        const summary: InterParserResult['summary'] = {};
        const headerLines = lines.slice(0, 10);
        const accountMatch = headerLines.join('\n').match(/conta\s*;\s*(\d+)/i);
        if (accountMatch) summary.account = accountMatch[1];
        const periodMatch = headerLines.join('\n').match(/período\s*;\s*(.+)/i);
        if (periodMatch) summary.period = periodMatch[1];
        const balanceMatch = headerLines.join('\n').match(/saldo\s*;\s*([\d.,-]+)/i);
        if (balanceMatch) summary.finalBalance = parseCurrency(balanceMatch[1]);
        
        const normalizeText = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
        let headerRowIndex = -1;
        let columns: string[] = [];
        for (const [i, line] of lines.entries()) {
            if (line.includes(';')) {
                const normalizedLine = normalizeText(line);
                const keywords = ['data lancamento', 'historico', 'descricao', 'valor', 'saldo'];
                const keywordsFound = keywords.filter(k => normalizedLine.includes(k)).length;
                if (keywordsFound >= 3) {
                    headerRowIndex = i;
                    columns = line.split(';').map(c => c.trim());
                    break;
                }
            }
        }
    
        if (headerRowIndex === -1) {
            throw new Error("Cabeçalho de transações não encontrado.");
        }
    
        const colPatterns = { date: ['data lancamento'], type: ['historico'], description: ['descricao'], amount: ['valor'], balance: ['saldo'] };
        const colMap: { [key: string]: number } = {};
        for (const [field, patterns] of Object.entries(colPatterns)) {
            for (const [i, col] of columns.entries()) {
                if (patterns.some(p => normalizeText(col).includes(p))) {
                    colMap[field] = i;
                    break;
                }
            }
        }
    
        if (colMap.date === undefined || colMap.amount === undefined || colMap.balance === undefined) {
            throw new Error(`Colunas obrigatórias não encontradas. Mapeado: ${Object.keys(colMap).join(', ')}`);
        }
    
        const parsedTransactions: (CsvTransaction & { balance: number })[] = [];
        const transactionLines = lines.slice(headerRowIndex + 1);
        for (const line of transactionLines) {
            const values = line.split(';');
            if (values.length < columns.length) continue;
    
            const dataStr = values[colMap.date]?.trim();
            const data = parseBrDate(dataStr);
            if (!data) continue;
    
            const historico = values[colMap.type]?.trim().replace(/"/g, '') || '';
            const descricaoRaw = values[colMap.description]?.trim().replace(/"/g, '').replace(/\s\s+/g, ' ') || '';
            const descricao = [historico, descricaoRaw].filter(Boolean).join(': ').trim();
            
            const valor = parseCurrency(values[colMap.amount] || '0');
            const balance = parseCurrency(values[colMap.balance] || '0');
            
            if (descricao && !isNaN(valor) && valor !== 0) {
                parsedTransactions.push({ data, descricao, valor, balance, originalLine: line });
            }
        }
    
        const warnings: string[] = [];
        for (let i = 0; i < parsedTransactions.length - 1; i++) {
            const current = parsedTransactions[i];
            const next = parsedTransactions[i + 1];
            const expectedCurrentBalance = next.balance + current.valor;
            if (Math.abs(expectedCurrentBalance - current.balance) > 0.015) {
                warnings.push(`Inconsistência de saldo em ${formatDate(current.data)}`);
            }
        }
        
        const finalTransactions = parsedTransactions.map(({ balance, ...rest }) => rest).reverse();
    
        return { summary, transactions: finalTransactions, warnings };
    }
    
    const handleImportData = (file: File) => {
        const reader = new FileReader();
        const fileName = file.name.toLowerCase();

        reader.onload = (event) => {
            try {
                if (fileName.endsWith('.json')) {
                    const importedData = JSON.parse(event.target?.result as string);
                    if (importedData.contas && importedData.transacoes) {
                        setConfirmation({
                            title: "Confirmar Importação de Backup",
                            message: "Isso substituirá todos os seus dados atuais pelos dados do arquivo de backup. Deseja continuar?",
                            buttons: [
                                { label: 'Cancelar', onClick: () => setConfirmation(null), style: 'secondary' },
                                {
                                    label: 'Importar e Substituir', onClick: () => {
                                        setContas(importedData.contas || []);
                                        setTransacoes(importedData.transacoes || []);
                                        setCartoes(importedData.cartoes || []);
                                        setCompras(importedData.compras || []);
                                        setParcelas(importedData.parcelas || []);
                                        setObjetivos(importedData.objetivos || []);
                                        setCategorias(importedData.categorias || CATEGORIAS_PADRAO);
                                        setProfilePicture(importedData.profilePicture || null);
                                        setSettings(importedData.settings || { showPercentageChange: false });
                                        setConfirmation(null);
                                        showToast("Dados importados com sucesso.", "success");
                                        setCurrentPage('resumo');
                                    }, style: 'primary'
                                }
                            ]
                        });
                    } else {
                        showToast("Arquivo de backup (.json) inválido.", "error");
                    }
                } else if (fileName.endsWith('.csv')) {
                    const content = event.target?.result as string;
                    try {
                        const { summary, transactions, warnings } = parseBancoInterStatement(content);
                        if (transactions.length === 0) {
                            showToast("Nenhuma transação válida encontrada no extrato do Banco Inter.", "error");
                            return;
                        }
                        
                        const initialImportRows: CsvImportRow[] = transactions.map(t => ({...t, selected: true, isDuplicate: false }));
                        
                        let detectedInitialBalance: { date: string; value: number } | undefined = undefined;
                        if (summary.finalBalance !== undefined && transactions.length > 0) {
                            const transactionsTotal = transactions.reduce((sum, t) => sum + t.valor, 0);
                            const initialBalance = summary.finalBalance - transactionsTotal;
                            const firstDate = transactions[0].data;
                            detectedInitialBalance = { date: firstDate, value: initialBalance };
                        }

                        setCsvImportState({ transactions: initialImportRows, fileName: file.name, detectedFinalBalance: summary.finalBalance, detectedInitialBalance });
                        
                        if (warnings.length > 0) {
                            showToast(`Importação com avisos: ${warnings.join('; ')}`, 'info');
                        }
                        
                        const defaultConta = contas.find(c => c.ativo);
                        setCsvDestinoConta(defaultConta?.id || '');
                        setCsvNewAccountName('');

                    } catch (interError: any) {
                        console.warn("Falha ao analisar como Banco Inter, tentando parser genérico.", interError);
                        // --- GENERIC PARSER (FALLBACK) ---
                        const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                        const delimiter = lines.some(l => l.includes(';')) ? ';' : ',';
                        let headerRowIndex = -1;
                        let colIndices = { data: -1, historico: -1, descricao: -1, credito: -1, debito: -1, valor: -1 };
                        const headerKeywords = {
                            data: ['data'], historico: ['histórico', 'historico'], descricao: ['descricao', 'descrição'],
                            credito: ['crédito', 'credito'], debito: ['débito', 'debito'], valor: ['valor']
                        };
                        
                        for (let i = 0; i < lines.length; i++) {
                            const headerCandidates = lines[i].toLowerCase().split(delimiter);
                            const tempIndices = { data: -1, historico: -1, descricao: -1, credito: -1, debito: -1, valor: -1 };
                            headerCandidates.forEach((h, index) => {
                                const hTrimmed = h.trim().replace(/"/g, '');
                                if (headerKeywords.data.some(k => hTrimmed.includes(k))) tempIndices.data = index;
                                if (headerKeywords.historico.some(k => hTrimmed.includes(k))) tempIndices.historico = index;
                                if (headerKeywords.descricao.some(k => hTrimmed.includes(k))) tempIndices.descricao = index;
                                if (headerKeywords.credito.some(k => hTrimmed.includes(k))) tempIndices.credito = index;
                                if (headerKeywords.debito.some(k => hTrimmed.includes(k))) tempIndices.debito = index;
                                if (headerKeywords.valor.some(k => hTrimmed.includes(k))) tempIndices.valor = index;
                            });
                            if (tempIndices.data !== -1 && (tempIndices.descricao !== -1 || tempIndices.historico !== -1) && (tempIndices.valor !== -1 || (tempIndices.credito !== -1 && tempIndices.debito !== -1))) {
                                headerRowIndex = i;
                                colIndices = tempIndices;
                                break;
                            }
                        }
        
                        if (headerRowIndex === -1) {
                            showToast("Cabeçalho não encontrado no CSV. Verifique as colunas (Data, Histórico/Descrição, Valor/Crédito/Débito).", "error");
                            return;
                        }
                        
                        const parsedTransactions: CsvTransaction[] = [];
                        for (const line of lines.slice(headerRowIndex + 1)) {
                            const values = line.split(delimiter);
                            if (values.length < 2) continue;
                            const dataStr = values[colIndices.data]?.trim();
                            const data = parseBrDate(dataStr);
                            if (!data) continue;
                            const historicoVal = colIndices.historico !== -1 ? (values[colIndices.historico] || '').trim().replace(/"/g, '') : '';
                            const descricaoVal = colIndices.descricao !== -1 ? (values[colIndices.descricao] || '').trim().replace(/"/g, '') : '';
                            const descricao = (historicoVal && descricaoVal) ? `${historicoVal}: ${descricaoVal}` : (historicoVal || descricaoVal);
                            let valor = 0;
                            if (colIndices.valor !== -1) valor = parseCurrency(values[colIndices.valor] || '0');
                            else valor = parseCurrency(values[colIndices.credito] || '0') - parseCurrency(values[colIndices.debito] || '0');
        
                            if (descricao && !isNaN(valor) && valor !== 0) {
                                parsedTransactions.push({ data, descricao, valor, originalLine: line });
                            }
                        }
    
                        if (parsedTransactions.length > 0) {
                            const initialImportRows = parsedTransactions.reverse().map(t => ({...t, selected: true, isDuplicate: false}));
                            setCsvImportState({ transactions: initialImportRows, fileName: file.name });
                            const defaultConta = contas.find(c => c.ativo);
                            setCsvDestinoConta(defaultConta?.id || '');
                            setCsvNewAccountName('');
                        } else {
                            showToast("Nenhuma transação válida foi encontrada no arquivo CSV.", "error");
                        }
                    }
                } else {
                    showToast("Formato de arquivo não suportado. Use .json ou .csv.", "error");
                }
            } catch (error) {
                showToast("Erro fatal ao ler o arquivo. Verifique o formato.", "error");
            }
        };
        reader.readAsText(file, 'latin1'); // Use 'latin1' for better compatibility with Brazilian bank exports
    };

    const handleConfirmCsvImport = (e: React.FormEvent) => {
        e.preventDefault();
        if (!csvImportState || !csvDestinoConta) return;

        const entradaCat = categorias.find(c => c.nome === 'Outras Entradas');
        const saidaCat = categorias.find(c => c.nome === 'Outras Despesas');

        if (!entradaCat || !saidaCat) {
            showToast("Categorias padrão 'Outras Entradas' ou 'Outras Despesas' não encontradas.", "error");
            return;
        }

        const agora = new Date().toISOString();
        const novasTransacoes = csvImportState.transactions
          .filter(t => t.selected)
          .map(t => {
            const isEntrada = t.valor >= 0;
            return {
                id: crypto.randomUUID(),
                conta_id: csvDestinoConta,
                data: t.data,
                valor: Math.abs(t.valor),
                categoria_id: isEntrada ? entradaCat.id : saidaCat.id,
                tipo: isEntrada ? TipoCategoria.Entrada : TipoCategoria.Saida,
                descricao: t.descricao,
                previsto: false,
                realizado: true,
                createdAt: agora,
                updatedAt: agora,
            } as TransacaoBanco;
        });

        setTransacoes(prev => [...prev, ...novasTransacoes]);
        setCsvImportState(null);
        showToast(`${novasTransacoes.length} transações importadas com sucesso!`, "success");
    };

    const handleCreateAccountFromCsv = () => {
        if (!csvNewAccountName.trim()) {
            showToast("O nome da conta não pode estar vazio.", "error");
            return;
        }
        
        const dataMaisAntiga = csvImportState?.transactions.reduce((min, t) => t.data < min ? t.data : min, '9999-12-31');
        
        let saldoInicialValue = 0;
        let dataInicialValue = dataMaisAntiga !== '9999-12-31' ? dataMaisAntiga : getTodayString();

        if (csvImportState?.detectedInitialBalance) {
            saldoInicialValue = csvImportState.detectedInitialBalance.value;
            dataInicialValue = csvImportState.detectedInitialBalance.date;
        }
    
        const novaConta = handleAddConta({
            nome: csvNewAccountName,
            saldo_inicial: saldoInicialValue,
            ativo: true,
            data_inicial: dataInicialValue,
            cor: CORES_CARTAO[Math.floor(Math.random() * CORES_CARTAO.length)].value
        });
    
        if (novaConta) {
            setCsvNewAccountName('');
            setCsvDestinoConta(novaConta.id); // Auto-select the new account
        }
    };
    
    const handleToggleCsvRow = (index: number) => {
        if (!csvImportState) return;
        const updated = [...csvImportState.transactions];
        updated[index].selected = !updated[index].selected;
        setCsvImportState({ ...csvImportState, transactions: updated });
    };

    const handleSelectAllCsv = (select: boolean) => {
        if (!csvImportState) return;
        const updated = csvImportState.transactions.map(t => ({
            ...t,
            selected: select ? !t.isDuplicate : false, // If selecting all, respect duplicates. If deselecting, deselect all.
        }));
        setCsvImportState({ ...csvImportState, transactions: updated });
    };

    // Global Modal Effects
    useEffect(() => {
        if (isTransacaoModalOpen) {
            const transacao = modalState.data?.transacao as TransacaoBanco | null;
            
            if (transacao) { // Editing
                setTransacaoForm({
                    data: transacao.data,
                    conta_id: transacao.conta_id,
                    categoria_id: transacao.categoria_id,
                    valor: String(transacao.valor * 100),
                    descricao: transacao.descricao,
                    previsto: transacao.previsto,
                    recorrencia: transacao.recorrencia || null,
                });
                const isBlocked = transacao.meta_saldo_inicial && transacoes.some(tx => tx.conta_id === transacao.conta_id && !tx.meta_saldo_inicial);
                setSaldoInicialEditBlocked(isBlocked);
            } else { // Creating
                const defaultContaId = modalState.data?.contaId || (currentPage === 'contas-extrato' && selectedViewId !== 'all' ? selectedViewId : contas.filter(c => c.ativo)[0]?.id || '');
                const defaultDate = modalState.data?.prefillDate || getTodayString();
                setTransacaoForm({
                    data: defaultDate,
                    conta_id: defaultContaId,
                    categoria_id: '',
                    valor: '',
                    descricao: '',
                    previsto: false,
                    recorrencia: null,
                });
                setSaldoInicialEditBlocked(false);
            }
        }
    }, [isTransacaoModalOpen, modalState.data, contas, transacoes, currentPage, selectedViewId]);
    
    useEffect(() => {
        if (isCompraModalOpen) {
            const compra = modalState.data?.compra as CompraCartao | null;
            setEditingCompra(compra);
            if (compra) {
                setCompraForm({ 
                    data_compra: compra.data_compra, 
                    valor_total: String(compra.valor_total * 100),
                    categoria_id: compra.categoria_id, 
                    descricao: compra.descricao, 
                    estorno: compra.estorno, 
                    cartao_id: compra.cartao_id,
                    parcelas: compra.parcelas_total,
                });
            } else {
                const defaultCartaoId = modalState.data?.cartaoId || (currentPage === 'cartoes' && selectedViewId !== 'all' ? selectedViewId : (cartoes[0]?.id || ''));
                const defaultDate = modalState.data?.prefillDate || getTodayString();
                const saidaCategorias = categorias.filter(c => c.tipo === TipoCategoria.Saida);
                setCompraForm({ 
                    data_compra: defaultDate, 
                    valor_total: '', 
                    categoria_id: saidaCategorias.length > 0 ? saidaCategorias[0].id : '', 
                    descricao: '', 
                    estorno: false, 
                    cartao_id: defaultCartaoId,
                    parcelas: 1,
                });
            }
        }
    }, [isCompraModalOpen, modalState.data, currentPage, selectedViewId, cartoes, categorias]);

    useEffect(() => {
        if (isTransferModalOpen) {
            const transferencia = modalState.data?.transferencia as TransacaoBanco | null;
            if (transferencia) { // Editing
                const par = transacoes.find(p => p.id === transferencia.transferencia_par_id);
                if (!par) return;
                const [origemLeg, destinoLeg] = transferencia.id < par.id ? [transferencia, par] : [par, transferencia];
                setTransferenciaForm({
                    data: origemLeg.data,
                    origem_id: origemLeg.conta_id,
                    destino_id: destinoLeg.conta_id,
                    valor: String(origemLeg.valor * 100),
                    descricao: origemLeg.descricao,
                });
            } else { // Creating
                const activeContas = contas.filter(c => c.ativo);
                setTransferenciaForm({
                    data: getTodayString(),
                    origem_id: modalState.data?.contaId || activeContas[0]?.id || '',
                    destino_id: activeContas.filter(c => c.id !== (modalState.data?.contaId || activeContas[0]?.id))[0]?.id || '',
                    valor: '',
                    descricao: '',
                });
            }
        }
    }, [isTransferModalOpen, modalState.data, contas, transacoes]);

    // CSV Duplicate Detection Effect
    useEffect(() => {
        if (!csvDestinoConta || !csvImportState) return;
    
        const transacoesDaConta = transacoes.filter(t => t.conta_id === csvDestinoConta);
        // Create a Set for quick lookups. Key: 'YYYY-MM-DD_123.45'
        const existingTransactions = new Set(
            transacoesDaConta.map(t => `${t.data}_${t.valor.toFixed(2)}`)
        );
    
        const updatedTransactions = csvImportState.transactions.map(t => {
            const key = `${t.data}_${Math.abs(t.valor).toFixed(2)}`;
            const isDuplicate = existingTransactions.has(key);
            return {
                ...t,
                isDuplicate,
                selected: !isDuplicate, // Auto-deselect potential duplicates
            };
        });
    
        // Avoid infinite loops by checking if the data actually changed
        if (JSON.stringify(updatedTransactions) !== JSON.stringify(csvImportState.transactions)) {
            setCsvImportState(prev => prev ? { ...prev, transactions: updatedTransactions } : null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [csvDestinoConta, transacoes]); // Reruns when account changes or transactions are updated.


    // Global Modal Submit Handlers
    const handleTransacaoSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const editingTransacao = modalState.data?.transacao as TransacaoBanco | null;
        if (!transacaoForm.conta_id || !transacaoForm.categoria_id || !transacaoForm.valor) return;

        const data = {
            ...transacaoForm,
            valor: parseFloat(transacaoForm.valor) / 100 || 0,
            realizado: !transacaoForm.previsto,
        };

        let success = false;
        if (editingTransacao) {
            success = handleUpdateTransacao({ ...editingTransacao, ...data });
        } else {
            success = handleAddTransacao(data);
        }
        if (success) closeModal();
    };

    const handleTransferenciaSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const editingTransferencia = modalState.data?.transferencia as TransacaoBanco | null;
        const { origem_id, destino_id, valor, data, descricao } = transferenciaForm;
        if (!origem_id || !destino_id || !valor) return;

        let success = false;
        if (editingTransferencia) {
            success = handleUpdateTransferencia(editingTransferencia.id, origem_id, destino_id, parseFloat(valor) / 100 || 0, data, descricao);
        } else {
            success = handleTransferencia(origem_id, destino_id, parseFloat(valor) / 100 || 0, data, descricao);
        }
        
        if (success) closeModal();
    };

    const handleCompraSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const valorTotal = parseFloat(compraForm.valor_total) / 100 || 0;
        if (!compraForm.cartao_id || !compraForm.data_compra || (!compraForm.estorno && !compraForm.categoria_id) || valorTotal <= 0 || compraForm.parcelas < 1) {
            showToast("Verifique os campos obrigatórios.", "error");
            return;
        }

        const data: Omit<CompraCartao, 'id' | 'createdAt' | 'updatedAt'> = {
            cartao_id: compraForm.cartao_id,
            data_compra: compraForm.data_compra,
            valor_total: valorTotal,
            parcelas_total: compraForm.parcelas,
            categoria_id: compraForm.estorno ? (categorias.find(c => c.tipo === TipoCategoria.Estorno)?.id || '') : compraForm.categoria_id,
            descricao: compraForm.descricao,
            estorno: compraForm.estorno,
        };

        let success = false;
        if (editingCompra) {
            success = handleUpdateCompraCartao({ ...editingCompra, ...data });
        } else {
            success = handleAddCompraCartao(data);
        }
        if (success) closeModal();
    };
    
    const helperText = useMemo(() => {
        const cartao = cartoes.find(c => c.id === compraForm.cartao_id);
        if (!cartao || !compraForm.data_compra) return '';
        try {
            const d = new Date(compraForm.data_compra + "T12:00:00Z");
            if (isNaN(d.getTime())) return '';
            const {year, month} = computeFirstCompetency(d, cartao.dia_fechamento);
            const first = new Date(year, month, 1);
            const mes = first.toLocaleDateString('pt-BR', { month:'short', year:'numeric' });
            return `1ª parcela em: ${mes} • Vencimento: dia ${cartao.dia_vencimento}`;
        } catch {
            return '';
        }
    }, [compraForm.cartao_id, compraForm.data_compra, cartoes]);


    const handlePageChange = (page: Page, state: NavigationState | null = null) => {
      setCurrentPage(page);
      setNavigationState(state);
      if (state?.viewId) {
        setSelectedViewId(state.viewId);
      } else {
        setSelectedViewId('all'); // Reset view if not specified
      }
      if (state?.month) {
        setSelectedMonth(state.month);
      }
    };
    
    const clearNavigationState = () => setNavigationState(null);

    const searchResults = useMemo(() => {
      if (!searchTerm.trim()) {
        return { contas: [], cartoes: [], transacoes: [], compras: [] };
      }
      const lowerCaseTerm = searchTerm.toLowerCase();
  
      const filteredContas = contas.filter(c => c.nome.toLowerCase().includes(lowerCaseTerm));
      const filteredCartoes = cartoes.filter(c => c.apelido.toLowerCase().includes(lowerCaseTerm));
      const filteredTransacoes = transacoes.filter(t => t.descricao.toLowerCase().includes(lowerCaseTerm));
      const filteredCompras = compras.filter(c => c.descricao.toLowerCase().includes(lowerCaseTerm));
  
      return {
        contas: filteredContas,
        cartoes: filteredCartoes,
        transacoes: filteredTransacoes,
        compras: filteredCompras,
      };
    }, [searchTerm, contas, cartoes, transacoes, compras]);

    const handleSearchResultClick = (item: any, type: 'conta' | 'cartao' | 'transacao' | 'compra') => {
      setIsSearchModalOpen(false);
      setSearchTerm('');
      
      switch(type) {
        case 'conta':
          handlePageChange('contas-extrato', { viewId: item.id, month: item.data_inicial.slice(0, 7) });
          break;
        case 'cartao':
          handlePageChange('cartoes', { viewId: item.id });
          break;
        case 'transacao':
          handlePageChange('contas-extrato', { viewId: item.conta_id, month: item.data.slice(0, 7) });
          break;
        case 'compra':
          handlePageChange('cartoes', { viewId: item.cartao_id, month: item.data_compra.slice(0, 7) });
          break;
      }
    };
  const renderPage = () => {
    const pageProps = {
      modalState,
      openModal,
      closeModal,
      selectedView: selectedViewId,
      setSelectedView: setSelectedViewId,
      selectedMonth,
      onMonthChange: setSelectedMonth
    };

    switch (currentPage) {
      case 'resumo':
        return <ResumoPage 
                    contas={contas} 
                    transacoes={transacoes} 
                    cartoes={cartoes}
                    compras={compras}
                    parcelas={parcelas}
                    categorias={categorias}
                    setCurrentPage={handlePageChange}
                    openModal={openModal}
                    selectedMonth={selectedMonth}
                    onMonthChange={setSelectedMonth}
                    settings={settings}
                />;
      case 'contas-extrato':
        return <ContasExtratoPage 
                    contas={contas} transacoes={transacoes} categorias={categorias}
                    addConta={handleAddConta} updateConta={handleUpdateConta} deleteConta={handleDeleteConta}
                    deleteTransacao={handleDeleteTransacao} 
                    deleteTransacoes={handleDeleteTransacoes}
                    updateTransacoesCategoria={handleMassCategoryUpdate}
                    toggleTransactionRealizado={handleToggleTransactionRealizado}
                    navigationState={navigationState}
                    clearNavigationState={clearNavigationState}
                    {...pageProps}
                />;
      case 'cartoes':
        return <CartoesPage cartoes={cartoes} contas={contas} categorias={categorias.filter(c => c.tipo === TipoCategoria.Saida || c.tipo === TipoCategoria.Estorno)}
                    compras={compras} parcelas={parcelas} transacoes={transacoes}
                    addCartao={handleAddCartao} updateCartao={handleUpdateCartao} deleteCartao={handleDeleteCartao} 
                    addCompraCartao={handleAddCompraCartao} updateCompraCartao={handleUpdateCompraCartao}
                    deleteCompraCartao={handleDeleteCompraCartao} pagarFatura={handlePagarFatura} 
                    {...pageProps}
                />;
      case 'fluxo':
        return <FluxoCaixaPage 
                  contas={contas} 
                  transacoes={transacoes} 
                  categorias={categorias} 
                  compras={compras} 
                  parcelas={parcelas} 
                  selectedMonth={selectedMonth} 
                  onMonthChange={setSelectedMonth} 
                />;
      case 'investimentos':
        return <InvestimentosPage 
                    objetivos={objetivos}
                    transacoes={transacoes}
                    contas={contas}
                    addObjetivo={handleAddObjetivo}
                    updateObjetivo={handleUpdateObjetivo}
                    deleteObjetivo={handleDeleteObjetivo}
                    adicionarDinheiroObjetivo={handleAdicionarDinheiroObjetivo}
                    {...{modalState, openModal, closeModal}}
                />;
       case 'perfil':
        return <PerfilPage
                    categorias={categorias} 
                    transacoes={transacoes} 
                    compras={compras}
                    parcelas={parcelas}
                    selectedMonth={selectedMonth}
                    onMonthChange={setSelectedMonth}
                    addCategoria={handleAddCategoria} 
                    updateCategoria={handleUpdateCategoria} 
                    deleteCategoria={handleDeleteCategoria}
                    handleDeleteAllData={handleDeleteAllData}
                    handleExportData={handleExportData}
                    handleImportData={handleImportData}
                    settings={settings}
                    setSettings={setSettings}
                    navigationState={navigationState}
                    clearNavigationState={clearNavigationState}
                    {...{modalState, openModal, closeModal}}
                />;
      case 'calculadora-juros-compostos':
        return <CalculadoraJurosCompostosPage />;
      case 'calculadora-reserva-emergencia':
        return <CalculadoraReservaEmergenciaPage />;
      default:
        return <ResumoPage
                    contas={contas}
                    transacoes={transacoes}
                    cartoes={cartoes}
                    compras={compras}
                    parcelas={parcelas}
                    categorias={categorias}
                    setCurrentPage={handlePageChange}
                    openModal={openModal}
                    selectedMonth={selectedMonth}
                    onMonthChange={setSelectedMonth}
                    settings={settings}
                />;
    }
  };

  const editingTransacao = modalState.data?.transacao as TransacaoBanco | null;

  const handleNewTransaction = () => openModal('nova-transacao', {
    contaId: currentPage === 'contas-extrato' && selectedViewId !== 'all' ? selectedViewId : undefined,
    prefillDate: new Date().toISOString().slice(0, 7) === selectedMonth ? getTodayString() : `${selectedMonth}-15`,
  });
  
  const handleNewCardPurchase = () => openModal('nova-compra-cartao', {
    cartaoId: currentPage === 'cartoes' && selectedViewId !== 'all' ? selectedViewId : undefined,
    prefillDate: new Date().toISOString().slice(0, 7) === selectedMonth ? getTodayString() : `${selectedMonth}-15`,
  });

    const countSelectedCsv = csvImportState?.transactions.filter(t => t.selected).length || 0;
    const areAllCsvSelected = csvImportState ? countSelectedCsv === csvImportState.transactions.filter(t => !t.isDuplicate).length : false;
    
  return (
    <>
      <div className="flex h-screen w-full bg-gray-900 font-sans">
        <Sidebar currentPage={currentPage} setCurrentPage={(p) => handlePageChange(p)} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            setCurrentPage={handlePageChange}
            profilePicture={profilePicture}
            onImageSelect={setImageToCrop}
            onImageRemove={() => {
                setProfilePicture(null);
                showToast("Foto de perfil removida.");
            }}
            onSearchClick={() => setIsSearchModalOpen(true)}
          />
          <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-28 md:pb-8">
              {renderPage()}
          </main>
        </div>
      </div>

      <BottomNav
        currentPage={currentPage}
        setCurrentPage={(p) => handlePageChange(p)}
        onNewTransaction={handleNewTransaction}
        onNewCardPurchase={handleNewCardPurchase}
        hasAnyAccount={contas.length > 0}
        hasAnyCard={cartoes.length > 0}
      />
      
      {imageToCrop && (
        <ImageCropModal 
          imageSrc={imageToCrop}
          onClose={() => setImageToCrop(null)}
          onSave={(croppedImage) => {
            setProfilePicture(croppedImage);
            setImageToCrop(null);
            showToast("Foto de perfil atualizada com sucesso!");
          }}
        />
      )}

      {isSearchModalOpen && (
        <SearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          results={searchResults}
          onResultClick={handleSearchResultClick}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirmation && <ConfirmationModal data={confirmation} onClose={() => setConfirmation(null)} />}
      
      {/* Global Modals */}
        <Modal isOpen={isTransacaoModalOpen} onClose={closeModal} title={editingTransacao?.meta_saldo_inicial ? "Editar Saldo Inicial" : editingTransacao ? "Editar Transação" : "Nova Transação"} footer={
            <>
                <button type="button" onClick={closeModal} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                <button type="submit" form="transacao-form" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">Salvar</button>
            </>
        }>
            <form id="transacao-form" onSubmit={handleTransacaoSubmit} className="space-y-4">
                <div><label htmlFor="data-transacao" className="block text-sm font-medium text-gray-300 mb-1">Data</label><input id="data-transacao" type="date" value={transacaoForm.data} onChange={e => setTransacaoForm({...transacaoForm, data: e.target.value})} required className="w-full bg-gray-700 p-2 rounded-lg" disabled={!!editingTransacao?.meta_saldo_inicial && isSaldoInicialEditBlocked}/></div>
                <div className="relative"><label htmlFor="conta-transacao" className="block text-sm font-medium text-gray-300 mb-1">Conta</label><select id="conta-transacao" value={transacaoForm.conta_id} onChange={e => setTransacaoForm({...transacaoForm, conta_id: e.target.value})} required className="w-full bg-gray-700 p-2 pl-3 pr-10 rounded-lg disabled:bg-gray-600 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500" disabled={!!editingTransacao}><option value="" disabled>Selecione a conta</option>{contas.filter(c => c.ativo).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select><ChevronDown className="absolute right-3 top-9 text-gray-400 pointer-events-none" size={18} /></div>
                <div className="relative"><label htmlFor="cat-transacao" className="block text-sm font-medium text-gray-300 mb-1">Categoria</label><select id="cat-transacao" value={transacaoForm.categoria_id} onChange={e => setTransacaoForm({...transacaoForm, categoria_id: e.target.value})} required className="w-full bg-gray-700 p-2 pl-3 pr-10 rounded-lg disabled:bg-gray-600 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500" disabled={!!editingTransacao?.meta_saldo_inicial || !!editingTransacao?.meta_pagamento}><option value="" disabled>Selecione a categoria</option>{categorias.filter(c => c.tipo !== TipoCategoria.Transferencia).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select><ChevronDown className="absolute right-3 top-9 text-gray-400 pointer-events-none" size={18} /></div>
                <div><label htmlFor="valor-transacao" className="block text-sm font-medium text-gray-300 mb-1">Valor</label><CurrencyInput id="valor-transacao" value={transacaoForm.valor} onValueChange={v => setTransacaoForm({...transacaoForm, valor: v})} required className="w-full bg-gray-700 p-2 rounded-lg" placeholder="R$ 0,00" disabled={!!editingTransacao?.meta_saldo_inicial && isSaldoInicialEditBlocked}/></div>
                <div><label htmlFor="desc-transacao" className="block text-sm font-medium text-gray-300 mb-1">Descrição</label><input id="desc-transacao" type="text" value={transacaoForm.descricao} onChange={e => setTransacaoForm({...transacaoForm, descricao: e.target.value})} className="w-full bg-gray-700 p-2 rounded-lg" placeholder="Ex.: Compra supermercado"/></div>
                <div className="flex items-center"><input type="checkbox" id="previsto-transacao" checked={transacaoForm.previsto} onChange={e => setTransacaoForm({...transacaoForm, previsto: e.target.checked})} className="h-4 w-4 rounded" disabled={!!editingTransacao?.meta_saldo_inicial}/> <label htmlFor="previsto-transacao" className="ml-2 text-sm text-gray-300">Previsto?</label></div>
                <div>
                  <div className="flex items-center"><input type="checkbox" id="recorrente-transacao" checked={!!transacaoForm.recorrencia} onChange={e => setTransacaoForm({...transacaoForm, recorrencia: e.target.checked ? 'mensal' : null})} className="h-4 w-4 rounded"/> <label htmlFor="recorrente-transacao" className="ml-2 text-sm text-gray-300">Lançamento Recorrente</label></div>
                  {transacaoForm.recorrencia && (
                    <div className="mt-2 pl-6 relative">
                      <label htmlFor="frequencia-transacao" className="block text-sm font-medium text-gray-300 mb-1">Frequência</label>
                      <select id="frequencia-transacao" value={transacaoForm.recorrencia} onChange={e => setTransacaoForm({...transacaoForm, recorrencia: e.target.value as TransacaoBanco['recorrencia']})} className="w-full bg-gray-700 p-2 pl-3 pr-10 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-green-500">
                        <option value="diario">Diário</option>
                        <option value="semanal">Semanal</option>
                        <option value="mensal">Mensal</option>
                        <option value="anual">Anual</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-9 text-gray-400 pointer-events-none" size={18} />
                    </div>
                  )}
                </div>
            </form>
        </Modal>

        <Modal isOpen={isTransferModalOpen} onClose={closeModal} title={modalState.modal === 'editar-transferencia' ? "Editar Transferência" : "Nova Transferência"} footer={
             <>
                <button type="button" onClick={closeModal} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                <button type="submit" form="transferencia-form" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Salvar</button>
            </>
        }>
            <form id="transferencia-form" onSubmit={handleTransferenciaSubmit} className="space-y-4">
                <div className="relative"><label htmlFor="origem-transfer" className="block text-sm font-medium text-gray-300 mb-1">Conta de Origem</label><select id="origem-transfer" value={transferenciaForm.origem_id} onChange={e => setTransferenciaForm({...transferenciaForm, origem_id: e.target.value})} required className="w-full bg-gray-700 p-2 pl-3 pr-10 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-green-500"><option value="" disabled>Selecione...</option>{contas.filter(c => c.ativo).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select><ChevronDown className="absolute right-3 top-9 text-gray-400 pointer-events-none" size={18} /></div>
                <div className="relative"><label htmlFor="destino-transfer" className="block text-sm font-medium text-gray-300 mb-1">Conta de Destino</label><select id="destino-transfer" value={transferenciaForm.destino_id} onChange={e => setTransferenciaForm({...transferenciaForm, destino_id: e.target.value})} required className="w-full bg-gray-700 p-2 pl-3 pr-10 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-green-500"><option value="" disabled>Selecione...</option>{contas.filter(c => c.ativo && c.id !== transferenciaForm.origem_id).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select><ChevronDown className="absolute right-3 top-9 text-gray-400 pointer-events-none" size={18} /></div>
                <div><label htmlFor="data-transfer" className="block text-sm font-medium text-gray-300 mb-1">Data</label><input id="data-transfer" type="date" value={transferenciaForm.data} onChange={e => setTransferenciaForm({...transferenciaForm, data: e.target.value})} required className="w-full bg-gray-700 p-2 rounded-lg"/></div>
                <div><label htmlFor="valor-transfer" className="block text-sm font-medium text-gray-300 mb-1">Valor</label><CurrencyInput id="valor-transfer" value={transferenciaForm.valor} onValueChange={v => setTransferenciaForm({...transferenciaForm, valor: v})} required className="w-full bg-gray-700 p-2 rounded-lg" placeholder="R$ 0,00" /></div>
                <div><label htmlFor="desc-transfer" className="block text-sm font-medium text-gray-300 mb-1">Descrição</label><input id="desc-transfer" type="text" value={transferenciaForm.descricao} onChange={e => setTransferenciaForm({...transferenciaForm, descricao: e.target.value})} className="w-full bg-gray-700 p-2 rounded-lg" placeholder="Ex.: Transferência para poupança"/></div>
            </form>
        </Modal>

        <Modal 
          isOpen={isCompraModalOpen} 
          onClose={closeModal} 
          title={editingCompra ? "Editar Compra" : "Adicionar Nova Compra"}
          footer={
              <div className="flex justify-end space-x-3">
                   <button type="button" onClick={closeModal} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">Cancelar</button>
                   <button type="submit" form="compra-form" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50" disabled={!compraForm.cartao_id || !compraForm.data_compra || parseFloat(compraForm.valor_total)/100 <= 0 || (!compraForm.estorno && !compraForm.categoria_id)}>Salvar</button>
              </div>
          }
      >
          <form id="compra-form" onSubmit={handleCompraSubmit} className="space-y-4">
              <div className="relative">
                  <label htmlFor="compra-cartao" className="block text-sm font-medium text-gray-300 mb-1.5">Cartão</label>
                  <select id="compra-cartao" value={compraForm.cartao_id} onChange={e => setCompraForm({...compraForm, cartao_id: e.target.value})} required disabled={!!editingCompra} className="w-full h-11 bg-gray-700 border border-gray-600 rounded-lg pl-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-600 appearance-none">
                      <option value="" disabled>Selecione o cartão...</option>
                      {cartoes.map(c => <option key={c.id} value={c.id}>{c.apelido}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-[calc(50%+8px)] -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
              </div>

              <div>
                  <label htmlFor="compra-data" className="block text-sm font-medium text-gray-300 mb-1.5">Data da compra</label>
                  <input id="compra-data" type="date" value={compraForm.data_compra} onChange={e => setCompraForm({...compraForm, data_compra: e.target.value})} required className="w-full h-11 bg-gray-700 border border-gray-600 rounded-lg px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>

              <div>
                  <label htmlFor="compra-descricao" className="block text-sm font-medium text-gray-300 mb-1.5">Descrição</label>
                  <input id="compra-descricao" type="text" placeholder="Digite a descrição da compra" value={compraForm.descricao} onChange={e => setCompraForm({...compraForm, descricao: e.target.value})} className="w-full h-11 bg-gray-700 border border-gray-600 rounded-lg px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>

              <div className="relative">
                  <label htmlFor="compra-categoria" className="block text-sm font-medium text-gray-300 mb-1.5">Categoria</label>
                  <select id="compra-categoria" value={compraForm.categoria_id} onChange={e => setCompraForm({...compraForm, categoria_id: e.target.value})} required={!compraForm.estorno} disabled={compraForm.estorno} className="w-full h-11 bg-gray-700 border border-gray-600 rounded-lg pl-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-600 appearance-none">
                      <option value="" disabled>Selecione...</option>
                      {categorias.filter(c => c.tipo === TipoCategoria.Saida).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                   <ChevronDown className="absolute right-3 top-[calc(50%+8px)] -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="compra-valor" className="block text-sm font-medium text-gray-300 mb-1.5">Valor total (R$)</label>
                    <CurrencyInput id="compra-valor" placeholder="R$ 0,00" value={compraForm.valor_total} onValueChange={value => setCompraForm({...compraForm, valor_total: value})} required className="w-full h-11 bg-gray-700 border border-gray-600 rounded-lg px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                 </div>
                 <div>
                    <label htmlFor="compra-parcelas" className="block text-sm font-medium text-gray-300 mb-1.5">Parcelas</label>
                    <input id="compra-parcelas" type="number" min="1" max="36" value={compraForm.parcelas} onChange={e => setCompraForm({...compraForm, parcelas: Math.max(1, Math.min(36, Number(e.target.value) || 1))})} className="w-full h-11 bg-gray-700 border border-gray-600 rounded-lg px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                 </div>
              </div>

              {helperText && <p className="text-xs text-gray-400 mt-1">{helperText}</p>}
              
              <div className="flex items-center pt-2">
                  <input type="checkbox" id="estorno-compra" checked={compraForm.estorno} onChange={e => setCompraForm(prev => ({ ...prev, estorno: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 bg-gray-700"/>
                  <label htmlFor="estorno-compra" className="ml-3 block text-sm text-gray-300">É um estorno (crédito na fatura)?</label>
              </div>
          </form>
      </Modal>

        <Modal
            isOpen={!!csvImportState}
            onClose={() => setCsvImportState(null)}
            title={`Importar de "${csvImportState?.fileName}"`}
            footer={
                <>
                    <button onClick={() => setCsvImportState(null)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                    <button type="submit" form="csv-import-form" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg" disabled={!csvDestinoConta || countSelectedCsv === 0}>
                        Importar {countSelectedCsv} Transações
                    </button>
                </>
            }
        >
            <form id="csv-import-form" onSubmit={handleConfirmCsvImport}>
                <div className="space-y-4">
                    <div className="relative">
                        <label htmlFor="csv-conta-destino" className="block text-sm font-medium text-gray-300 mb-1">1. Para qual conta deseja importar?</label>
                        <select id="csv-conta-destino" value={csvDestinoConta} onChange={e => setCsvDestinoConta(e.target.value)} required className="w-full bg-gray-700 p-2 pl-3 pr-10 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-green-500">
                            <option value="" disabled>Selecione...</option>
                            {contas.filter(c => c.ativo).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-9 text-gray-400 pointer-events-none" size={18} />
                    </div>
                    
                    <div className="text-center text-sm text-gray-400">ou</div>
                    
                    <div>
                        <label htmlFor="csv-nova-conta" className="block text-sm font-medium text-gray-300 mb-1">Crie uma nova conta para este extrato:</label>
                        <div className="flex space-x-2">
                            <input id="csv-nova-conta" type="text" placeholder="Nome do Banco (Conta)" value={csvNewAccountName} onChange={e => setCsvNewAccountName(e.target.value)} className="w-full bg-gray-700 p-2 rounded-lg" />
                            <button type="button" onClick={handleCreateAccountFromCsv} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg whitespace-nowrap">Criar</button>
                        </div>
                        {csvImportState?.detectedFinalBalance !== undefined && (
                            <div className="mt-2 text-xs p-2 bg-blue-900/50 rounded-md flex items-center space-x-2 text-blue-300">
                                <Info size={14}/>
                                <span>Saldo final detectado: <strong>{formatCurrency(csvImportState.detectedFinalBalance)}</strong>. O saldo inicial será calculado automaticamente.</span>
                            </div>
                        )}
                        {csvImportState?.detectedInitialBalance && !csvImportState?.detectedFinalBalance && (
                            <div className="mt-2 text-xs p-2 bg-green-900/50 rounded-md flex items-center space-x-2 text-green-300">
                                <Info size={14}/>
                                <span>Saldo inicial detectado: <strong>{formatCurrency(csvImportState.detectedInitialBalance.value)}</strong> em {formatDate(csvImportState.detectedInitialBalance.date)}</span>
                            </div>
                        )}
                    </div>
                    
                    <hr className="border-gray-600" />
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">2. Selecione as transações para importar:</label>
                        <div className="max-h-60 overflow-y-auto bg-gray-900/50 p-2 rounded-lg border border-gray-700">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="text-left text-gray-300">
                                        <th className="p-2 w-10">
                                            <input type="checkbox" checked={areAllCsvSelected} onChange={e => handleSelectAllCsv(e.target.checked)} title="Marcar/Desmarcar todos" />
                                        </th>
                                        <th className="p-1">Data</th>
                                        <th className="p-1">Descrição</th>
                                        <th className="p-1 text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {csvImportState?.transactions.map((t, i) => (
                                        <tr key={i} className={`border-t border-gray-700 ${t.isDuplicate ? 'bg-yellow-900/40 text-gray-500' : ''}`}>
                                            <td className="p-2"><input type="checkbox" checked={t.selected} onChange={() => handleToggleCsvRow(i)} /></td>
                                            <td className="p-1 whitespace-nowrap">{formatDate(t.data)}</td>
                                            <td className="p-1">
                                                <div className="flex items-center space-x-2">
                                                    {t.isDuplicate && (
                                                        <span title="Possível duplicata">
                                                            <AlertTriangle size={12} className="text-yellow-400 flex-shrink-0" />
                                                        </span>
                                                    )}
                                                    <span className="truncate">{t.descricao}</span>
                                                </div>
                                            </td>
                                            <td className={`p-1 text-right font-mono ${t.valor >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(t.valor)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </form>
        </Modal>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
};

export default App;
