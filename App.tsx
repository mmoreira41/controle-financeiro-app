




import React, { useState, useMemo, useEffect } from 'react';
import { Page, ContaBancaria, TransacaoBanco, Cartao, Categoria, CompraCartao, ParcelaCartao, TipoCategoria, BandeiraCartao, ModalState, NavigationState } from './types';
import Sidebar from './components/Sidebar';
import ContasExtratoPage from './pages/ContasExtratoPage';
import CategoriasPage from './pages/CategoriasPage';
import FluxoCaixaPage from './pages/FluxoCaixaPage';
import CartoesPage from './pages/CartoesPage';
import ResumoPage from './pages/ResumoPage';
import { CATEGORIAS_PADRAO, CORES_CARTAO } from './constants';
import Toast from './components/Toast';
import ConfirmationModal, { ConfirmationModalData } from './components/ConfirmationModal';
import GlobalFAB from './components/GlobalFAB';
import { formatCurrency, computeFirstCompetency, addMonths, ymToISOFirstDay, splitInstallments, roundHalfUp } from './utils/format';
import Modal from './components/Modal';
import CurrencyInput from './components/CurrencyInput';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('resumo');
  const [selectedViewId, setSelectedViewId] = useState<'all' | string>('all');
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [navigationState, setNavigationState] = useState<NavigationState | null>(null);

  // Feedback System State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationModalData | null>(null);
  const [modalState, setModalState] = useState<ModalState>({ modal: null, data: null });
  
  const getTodayString = () => new Date().toISOString().split('T')[0];

  // Mock Data
  const [contas, setContas] = useState<ContaBancaria[]>([
    { id: 'b8d8e5e6-c5a4-4c4f-9b1d-2f0a1c2b3d4e', nome: 'Conta Corrente Nu', saldo_inicial: 0, data_inicial: '2024-07-01', ativo: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', nome: 'Poupança Itaú', saldo_inicial: 0, data_inicial: '2024-01-01', ativo: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ]);

  const [transacoes, setTransacoes] = useState<TransacaoBanco[]>([
     // Saldos Iniciais
     { id: 'si-1', conta_id: 'b8d8e5e6-c5a4-4c4f-9b1d-2f0a1c2b3d4e', data: '2024-07-01', valor: 1500, categoria_id: 't3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e71', tipo: TipoCategoria.Transferencia, descricao: 'Saldo inicial da conta', previsto: false, realizado: true, meta_saldo_inicial: true },
     { id: 'si-2', conta_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', data: '2024-01-01', valor: 10000, categoria_id: 't3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e71', tipo: TipoCategoria.Transferencia, descricao: 'Saldo inicial da conta', previsto: false, realizado: true, meta_saldo_inicial: true },
     // Outras Transações
     { id: '8f8e8d8c-7b6a-5432-1fed-cba987654321', conta_id: 'b8d8e5e6-c5a4-4c4f-9b1d-2f0a1c2b3d4e', data: '2024-07-01', valor: 5000, categoria_id: 'e0a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b50', tipo: TipoCategoria.Entrada, descricao: 'Salário Julho', previsto: false, realizado: true },
     { id: '7a6b5c4d-3e2f-1098-7654-3210fedcba98', conta_id: 'b8d8e5e6-c5a4-4c4f-9b1d-2f0a1c2b3d4e', data: '2024-07-05', valor: 800, categoria_id: 's1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c52', tipo: TipoCategoria.Saida, descricao: 'Supermercado', previsto: false, realizado: true },
     { id: 't-par-1', conta_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', data: '2024-07-10', valor: 1000, categoria_id: 't3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e70', tipo: TipoCategoria.Transferencia, descricao: 'Transferência para CC: Mesada', previsto: false, realizado: true, transferencia_par_id: 't-par-1-entrada' },
     { id: 't-par-1-entrada', conta_id: 'b8d8e5e6-c5a4-4c4f-9b1d-2f0a1c2b3d4e', data: '2024-07-10', valor: 1000, categoria_id: 't3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e70', tipo: TipoCategoria.Transferencia, descricao: 'Transferência de Poupança Itaú: Mesada', previsto: false, realizado: true, transferencia_par_id: 't-par-1' },
  ]);
  
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>(CATEGORIAS_PADRAO);
  const [compras, setCompras] = useState<CompraCartao[]>([]);
  const [parcelas, setParcelas] = useState<ParcelaCartao[]>([]);

  // States for Global Modals
  const [transacaoForm, setTransacaoForm] = useState({ data: getTodayString(), conta_id: '', categoria_id: '', valor: '', descricao: '', previsto: false });
  const [transferenciaForm, setTransferenciaForm] = useState({ data: getTodayString(), origem_id: '', destino_id: '', valor: '', descricao: '' });
  const [compraForm, setCompraForm] = useState({ data_compra: getTodayString(), valor_total: '', categoria_id: '', descricao: '', estorno: false, cartao_id: '', parcelas: 1 });
  const [editingCompra, setEditingCompra] = useState<CompraCartao | null>(null);
  
  const [isSaldoInicialEditBlocked, setSaldoInicialEditBlocked] = useState(false);

  const isTransacaoModalOpen = modalState.modal === 'nova-transacao' || modalState.modal === 'editar-transacao';
  const isTransferModalOpen = modalState.modal === 'nova-transferencia' || modalState.modal === 'editar-transferencia';
  const isCompraModalOpen = modalState.modal === 'nova-compra-cartao' || modalState.modal === 'editar-compra-cartao';
  
  const openModal = (modal: string, data?: any) => setModalState({ modal, data });
  const closeModal = () => setModalState({ modal: null, data: null });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 5000);
  };

  // Handlers Contas
  const handleAddConta = (contaData: { nome: string; saldo_inicial: number; ativo: boolean; data_inicial: string; }) => {
    if (contas.some(c => c.nome.toLowerCase() === contaData.nome.toLowerCase())) {
        showToast("Já existe uma conta com esse nome.", 'error');
        return false;
    }
    const categoriaSaldoInicial = categorias.find(c => c.nome === "Saldo Inicial" && c.sistema);
    if (!categoriaSaldoInicial) {
        showToast("Categoria 'Saldo Inicial' de sistema não encontrada.", 'error');
        return false;
    }

    const agora = new Date().toISOString();
    const novaConta: ContaBancaria = {
        id: crypto.randomUUID(),
        nome: contaData.nome,
        saldo_inicial: 0, // Saldo inicial é sempre 0 na conta
        data_inicial: contaData.data_inicial,
        ativo: contaData.ativo,
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
    return true;
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
      if (transacoesDaConta.length > 0) {
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
      const dataToUpdate = { ...catOriginal, nome: catAtualizada.nome, updatedAt: new Date().toISOString() };
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
                />;
      case 'contas-extrato':
        return <ContasExtratoPage 
                    contas={contas} transacoes={transacoes} categorias={categorias}
                    addConta={handleAddConta} updateConta={handleUpdateConta} deleteConta={handleDeleteConta}
                    deleteTransacao={handleDeleteTransacao} 
                    deleteTransacoes={handleDeleteTransacoes}
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
                  cartoes={cartoes} 
                  compras={compras} 
                  parcelas={parcelas} 
                  selectedMonth={selectedMonth} 
                  onMonthChange={setSelectedMonth} 
                />;
      case 'categorias':
        return <CategoriasPage categorias={categorias} transacoes={transacoes} compras={compras}
                    addCategoria={handleAddCategoria} updateCategoria={handleUpdateCategoria} deleteCategoria={handleDeleteCategoria} {...{modalState, openModal, closeModal}} />;
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
                />;
    }
  };

  const editingTransacao = modalState.data?.transacao as TransacaoBanco | null;

  const [year, month] = selectedMonth.split('-').map(Number);
  const fabContext = {
    currentPage: currentPage,
    selectedAccountId: currentPage === 'contas-extrato' ? selectedViewId : null,
    selectedCardId: currentPage === 'cartoes' ? selectedViewId : null,
    visibleYear: year,
    visibleMonth: month,
    selectedDay: null, // Fluxo page day selection not implemented
    hasAnyAccount: contas.length > 0,
    hasAnyCard: cartoes.length > 0,
  };

  const handleOpenNewCardPurchase = (opts: { cardId?: string | null; dateISO: string; }) => {
    openModal('nova-compra-cartao', {
      cartaoId: opts.cardId,
      prefillDate: opts.dateISO,
    });
  };

  const handleOpenNewBankTransaction = (opts: { accountId?: string | null; dateISO: string; }) => {
    openModal('nova-transacao', {
      contaId: opts.accountId,
      prefillDate: opts.dateISO,
    });
  };

  return (
    <>
      <div className="flex h-screen w-full bg-gray-900 font-sans">
        <Sidebar currentPage={currentPage} setCurrentPage={(p) => handlePageChange(p)} />
        <main className="flex-1 ml-64 p-8 overflow-y-auto">
          {renderPage()}
        </main>
      </div>

      <GlobalFAB
        context={fabContext}
        openNewCardPurchase={handleOpenNewCardPurchase}
        openNewBankTransaction={handleOpenNewBankTransaction}
      />
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
                <div><label htmlFor="data-transacao" className="block text-sm font-medium text-gray-300 mb-1">Data</label><input id="data-transacao" type="date" value={transacaoForm.data} onChange={e => setTransacaoForm({...transacaoForm, data: e.target.value})} required className="w-full bg-gray-700 p-2 rounded" disabled={!!editingTransacao?.meta_saldo_inicial && isSaldoInicialEditBlocked}/></div>
                <div><label htmlFor="conta-transacao" className="block text-sm font-medium text-gray-300 mb-1">Conta</label><select id="conta-transacao" value={transacaoForm.conta_id} onChange={e => setTransacaoForm({...transacaoForm, conta_id: e.target.value})} required className="w-full bg-gray-700 p-2 rounded disabled:bg-gray-600" disabled={!!editingTransacao}><option value="" disabled>Selecione a conta</option>{contas.filter(c => c.ativo).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
                <div><label htmlFor="cat-transacao" className="block text-sm font-medium text-gray-300 mb-1">Categoria</label><select id="cat-transacao" value={transacaoForm.categoria_id} onChange={e => setTransacaoForm({...transacaoForm, categoria_id: e.target.value})} required className="w-full bg-gray-700 p-2 rounded disabled:bg-gray-600" disabled={!!editingTransacao?.meta_saldo_inicial || !!editingTransacao?.meta_pagamento}><option value="" disabled>Selecione a categoria</option>{categorias.filter(c => c.tipo !== TipoCategoria.Transferencia).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
                <div><label htmlFor="valor-transacao" className="block text-sm font-medium text-gray-300 mb-1">Valor</label><CurrencyInput id="valor-transacao" value={transacaoForm.valor} onValueChange={v => setTransacaoForm({...transacaoForm, valor: v})} required className="w-full bg-gray-700 p-2 rounded" placeholder="R$ 0,00" disabled={!!editingTransacao?.meta_saldo_inicial && isSaldoInicialEditBlocked}/></div>
                <div><label htmlFor="desc-transacao" className="block text-sm font-medium text-gray-300 mb-1">Descrição</label><input id="desc-transacao" type="text" value={transacaoForm.descricao} onChange={e => setTransacaoForm({...transacaoForm, descricao: e.target.value})} className="w-full bg-gray-700 p-2 rounded" placeholder="Ex.: Compra supermercado"/></div>
                <div className="flex items-center"><input type="checkbox" id="previsto-transacao" checked={transacaoForm.previsto} onChange={e => setTransacaoForm({...transacaoForm, previsto: e.target.checked})} className="h-4 w-4 rounded" disabled={!!editingTransacao?.meta_saldo_inicial}/> <label htmlFor="previsto-transacao" className="ml-2 text-sm text-gray-300">Previsto?</label></div>
            </form>
        </Modal>

        <Modal isOpen={isTransferModalOpen} onClose={closeModal} title={modalState.modal === 'editar-transferencia' ? "Editar Transferência" : "Nova Transferência"} footer={
             <>
                <button type="button" onClick={closeModal} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                <button type="submit" form="transferencia-form" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Salvar</button>
            </>
        }>
            <form id="transferencia-form" onSubmit={handleTransferenciaSubmit} className="space-y-4">
                <div><label htmlFor="origem-transfer" className="block text-sm font-medium text-gray-300 mb-1">Conta de Origem</label><select id="origem-transfer" value={transferenciaForm.origem_id} onChange={e => setTransferenciaForm({...transferenciaForm, origem_id: e.target.value})} required className="w-full bg-gray-700 p-2 rounded"><option value="" disabled>Selecione...</option>{contas.filter(c => c.ativo).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
                <div><label htmlFor="destino-transfer" className="block text-sm font-medium text-gray-300 mb-1">Conta de Destino</label><select id="destino-transfer" value={transferenciaForm.destino_id} onChange={e => setTransferenciaForm({...transferenciaForm, destino_id: e.target.value})} required className="w-full bg-gray-700 p-2 rounded"><option value="" disabled>Selecione...</option>{contas.filter(c => c.ativo && c.id !== transferenciaForm.origem_id).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
                <div><label htmlFor="data-transfer" className="block text-sm font-medium text-gray-300 mb-1">Data</label><input id="data-transfer" type="date" value={transferenciaForm.data} onChange={e => setTransferenciaForm({...transferenciaForm, data: e.target.value})} required className="w-full bg-gray-700 p-2 rounded"/></div>
                <div><label htmlFor="valor-transfer" className="block text-sm font-medium text-gray-300 mb-1">Valor</label><CurrencyInput id="valor-transfer" value={transferenciaForm.valor} onValueChange={v => setTransferenciaForm({...transferenciaForm, valor: v})} required className="w-full bg-gray-700 p-2 rounded" placeholder="R$ 0,00" /></div>
                <div><label htmlFor="desc-transfer" className="block text-sm font-medium text-gray-300 mb-1">Descrição</label><input id="desc-transfer" type="text" value={transferenciaForm.descricao} onChange={e => setTransferenciaForm({...transferenciaForm, descricao: e.target.value})} className="w-full bg-gray-700 p-2 rounded" placeholder="Ex.: Transferência para poupança"/></div>
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
              <div>
                  <label htmlFor="compra-cartao" className="block text-sm font-medium text-gray-300 mb-1.5">Cartão</label>
                  <select id="compra-cartao" value={compraForm.cartao_id} onChange={e => setCompraForm({...compraForm, cartao_id: e.target.value})} required disabled={!!editingCompra} className="w-full h-11 bg-gray-700 border border-gray-600 rounded-lg px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-600">
                      <option value="" disabled>Selecione o cartão...</option>
                      {cartoes.map(c => <option key={c.id} value={c.id}>{c.apelido}</option>)}
                  </select>
              </div>

              <div>
                  <label htmlFor="compra-data" className="block text-sm font-medium text-gray-300 mb-1.5">Data da compra</label>
                  <input id="compra-data" type="date" value={compraForm.data_compra} onChange={e => setCompraForm({...compraForm, data_compra: e.target.value})} required className="w-full h-11 bg-gray-700 border border-gray-600 rounded-lg px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>

              <div>
                  <label htmlFor="compra-descricao" className="block text-sm font-medium text-gray-300 mb-1.5">Descrição</label>
                  <input id="compra-descricao" type="text" placeholder="Digite a descrição da compra" value={compraForm.descricao} onChange={e => setCompraForm({...compraForm, descricao: e.target.value})} className="w-full h-11 bg-gray-700 border border-gray-600 rounded-lg px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>

              <div>
                  <label htmlFor="compra-categoria" className="block text-sm font-medium text-gray-300 mb-1.5">Categoria</label>
                  <select id="compra-categoria" value={compraForm.categoria_id} onChange={e => setCompraForm({...compraForm, categoria_id: e.target.value})} required={!compraForm.estorno} disabled={compraForm.estorno} className="w-full h-11 bg-gray-700 border border-gray-600 rounded-lg px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-600">
                      <option value="" disabled>Selecione...</option>
                      {categorias.filter(c => c.tipo === TipoCategoria.Saida).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
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

    </>
  );
};

export default App;