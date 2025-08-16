import React, { useState, useMemo } from 'react';
import { useAuth } from './src/contexts/AuthContext';
import { useContas } from './src/hooks/useContas';
import { useTransacoes } from './src/hooks/useTransacoes';
import { useCategorias } from './src/hooks/useCategorias';

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
import Modal from './components/Modal';
import CurrencyInput from './components/CurrencyInput';

import { Page, ModalState, NavigationState, TipoCategoria } from './types';

const AppSupabase: React.FC = () => {
  const { user, signOut } = useAuth();
  const { contas, loading: contasLoading, addConta, updateConta, deleteConta } = useContas();
  const { transacoes, loading: transacoesLoading, addTransacao, updateTransacao, deleteTransacao } = useTransacoes();
  const { categorias, loading: categoriasLoading } = useCategorias();

  const [currentPage, setCurrentPage] = useState<Page>('resumo');
  const [selectedViewId, setSelectedViewId] = useState<'all' | string>('all');
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [navigationState, setNavigationState] = useState<NavigationState | null>(null);
  const [modalState, setModalState] = useState<ModalState>({ modal: null, data: null });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Estados fictícios para compatibilidade (serão implementados depois)
  const [cartoes] = useState([]);
  const [compras] = useState([]);
  const [parcelas] = useState([]);
  const [objetivos] = useState([]);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  // Estado para nova transação
  const [transacaoForm, setTransacaoForm] = useState({
    conta_id: '',
    valor: '',
    categoria_id: '',
    tipo: TipoCategoria.Saida,
    descricao: '',
    data: new Date().toISOString().split('T')[0],
    realizado: true
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  const openModal = (modal: string, data?: any) => {
    setModalState({ modal, data });
  };

  const closeModal = () => {
    setModalState({ modal: null, data: null });
  };

  const handlePageChange = (page: Page, state?: NavigationState | null) => {
    setCurrentPage(page);
    if (state) {
      setNavigationState(state);
    }
  };

  const clearNavigationState = () => {
    setNavigationState(null);
  };

  // Loading state
  if (contasLoading || transacoesLoading || categoriasLoading) {
    return (
      <div className="flex h-screen w-full bg-gray-900 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  // Wrapper functions for compatibility with page interfaces
  const addContaWrapper = async (contaData: { nome: string; saldo_inicial: number; ativo: boolean; data_inicial: string; }) => {
    return await addConta(contaData);
  };

  const updateContaWrapper = async (conta: Omit<ContaBancaria, 'saldo_inicial'>, novoSaldoInicial: number, novaDataInicial: string) => {
    const success = await updateConta(conta.id, {
      nome: conta.nome,
      ativo: conta.ativo,
      saldo_inicial: novoSaldoInicial,
      data_inicial: novaDataInicial
    });
    if (success) {
      showToast('Conta atualizada com sucesso!', 'success');
    } else {
      showToast('Erro ao atualizar conta', 'error');
    }
  };

  const deleteContaWrapper = async (id: string) => {
    await deleteConta(id);
  };

  // Funções de compatibilidade (implementar depois)
  const addCategoria = async (categoria: any) => {
    console.log('addCategoria:', categoria);
  };

  const updateCategoria = async (categoria: any) => {
    console.log('updateCategoria:', categoria);
  };

  const deleteCategoria = async (id: string) => {
    console.log('deleteCategoria:', id);
  };

  const deleteTransacoes = async (ids: string[]) => {
    for (const id of ids) {
      await deleteTransacao(id);
    }
    showToast(`${ids.length} transações excluídas`);
  };

  const updateTransacoesCategoria = async (ids: string[], newCategoryId: string) => {
    console.log('updateTransacoesCategoria:', ids, newCategoryId);
  };

  const handleDeleteAllData = () => {
    console.log('handleDeleteAllData');
  };

  const handleExportData = () => {
    console.log('handleExportData');
  };

  const handleImportData = (file: File) => {
    console.log('handleImportData:', file);
  };

  const addObjetivo = (objetivo: any) => {
    console.log('addObjetivo:', objetivo);
  };

  const updateObjetivo = (objetivo: any) => {
    console.log('updateObjetivo:', objetivo);
  };

  const deleteObjetivo = (id: string) => {
    console.log('deleteObjetivo:', id);
  };

  const adicionarDinheiroObjetivo = (objetivoId: string, contaId: string, valor: number, data: string): boolean => {
    console.log('adicionarDinheiroObjetivo:', objetivoId, contaId, valor, data);
    return true;
  };

  // Função para criar nova transação
  const handleTransacaoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transacaoForm.conta_id || !transacaoForm.categoria_id || !transacaoForm.valor || !transacaoForm.descricao) {
      showToast('Preencha todos os campos obrigatórios', 'error');
      return;
    }

    const valorNumerico = parseFloat(transacaoForm.valor) / 100;
    
    try {
      const novaTransacao = await addTransacao({
        conta_id: transacaoForm.conta_id,
        data: transacaoForm.data,
        valor: valorNumerico,
        categoria_id: transacaoForm.categoria_id,
        tipo: transacaoForm.tipo,
        descricao: transacaoForm.descricao,
        previsto: !transacaoForm.realizado,
        realizado: transacaoForm.realizado
      });

      if (novaTransacao) {
        showToast('Transação criada com sucesso!', 'success');
        closeModal();
        // Reset form
        setTransacaoForm({
          conta_id: '',
          valor: '',
          categoria_id: '',
          tipo: TipoCategoria.Saida,
          descricao: '',
          data: new Date().toISOString().split('T')[0],
          realizado: true
        });
      }
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      showToast('Erro ao criar transação', 'error');
    }
  };

  // Renderizar página atual
  const renderPage = () => {
    switch (currentPage) {
      case 'resumo':
        return (
          <ResumoPage
            contas={contas}
            transacoes={transacoes}
            cartoes={cartoes}
            compras={compras}
            parcelas={parcelas}
            categorias={categorias}
            setCurrentPage={handlePageChange}
            openModal={openModal}
          />
        );

      case 'contas-extrato':
        return (
          <ContasExtratoPage
            contas={contas}
            transacoes={transacoes}
            categorias={categorias}
            addConta={addContaWrapper}
            updateConta={updateContaWrapper}
            deleteConta={deleteContaWrapper}
            deleteTransacao={deleteTransacao}
            deleteTransacoes={deleteTransacoes}
            updateTransacoesCategoria={updateTransacoesCategoria}
            modalState={modalState}
            openModal={openModal}
            closeModal={closeModal}
            selectedView={selectedViewId}
            setSelectedView={setSelectedViewId}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            navigationState={navigationState}
            clearNavigationState={clearNavigationState}
          />
        );

      case 'fluxo-caixa':
        return (
          <FluxoCaixaPage
            contas={contas}
            transacoes={transacoes}
            categorias={categorias}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        );

      case 'cartoes':
        return (
          <CartoesPage
            cartoes={cartoes}
            contas={contas}
            categorias={categorias.filter(c => c.tipo === TipoCategoria.Saida || c.tipo === TipoCategoria.Estorno)}
            compras={compras}
            parcelas={parcelas}
            addCartao={() => {}}
            updateCartao={() => {}}
            deleteCartao={() => {}}
            addCompra={() => {}}
            updateCompra={() => {}}
            deleteCompra={() => {}}
            modalState={modalState}
            openModal={openModal}
            closeModal={closeModal}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            showToast={showToast}
          />
        );

      case 'investimentos':
        return (
          <InvestimentosPage
            objetivos={objetivos}
            transacoes={transacoes}
            contas={contas}
            addObjetivo={addObjetivo}
            updateObjetivo={updateObjetivo}
            deleteObjetivo={deleteObjetivo}
            adicionarDinheiroObjetivo={adicionarDinheiroObjetivo}
            modalState={modalState}
            openModal={openModal}
            closeModal={closeModal}
          />
        );

      case 'perfil':
        return (
          <PerfilPage
            categorias={categorias}
            transacoes={transacoes}
            compras={compras}
            parcelas={parcelas}
            addCategoria={addCategoria}
            updateCategoria={updateCategoria}
            deleteCategoria={deleteCategoria}
            modalState={modalState}
            openModal={openModal}
            closeModal={closeModal}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            handleDeleteAllData={handleDeleteAllData}
            handleExportData={handleExportData}
            handleImportData={handleImportData}
          />
        );

      case 'calculadora-juros':
        return <CalculadoraJurosCompostosPage />;

      case 'calculadora-reserva':
        return <CalculadoraReservaEmergenciaPage />;

      default:
        return (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-white mb-4">Página em desenvolvimento</h3>
            <p className="text-gray-400">Esta funcionalidade será implementada em breve.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-900 font-sans">
      <Sidebar currentPage={currentPage} setCurrentPage={(p) => handlePageChange(p)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          setCurrentPage={(p) => handlePageChange(p)}
          profilePicture={profilePicture}
          onImageSelect={setProfilePicture}
          onImageRemove={() => {
            setProfilePicture(null);
            showToast("Foto de perfil removida.");
          }}
          onLogout={signOut}
          user={user}
        />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-28 md:pb-8">
          {renderPage()}
        </main>
      </div>

      <BottomNav
        currentPage={currentPage}
        setCurrentPage={(p) => handlePageChange(p)}
        onNewTransaction={() => openModal('nova-transacao')}
        onNewCardPurchase={() => openModal('nova-compra')}
        hasAnyAccount={contas.length > 0}
        hasAnyCard={cartoes.length > 0}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Modal Nova Transação */}
      <Modal 
        isOpen={modalState.modal === 'nova-transacao'} 
        onClose={closeModal} 
        title="Nova Transação"
      >
        <form onSubmit={handleTransacaoSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Conta</label>
            <select
              value={transacaoForm.conta_id}
              onChange={(e) => setTransacaoForm({...transacaoForm, conta_id: e.target.value})}
              required
              className="w-full bg-gray-700 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Selecione uma conta</option>
              {contas.filter(c => c.ativo).map(conta => (
                <option key={conta.id} value={conta.id}>{conta.nome}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Tipo</label>
              <select
                value={transacaoForm.tipo}
                onChange={(e) => setTransacaoForm({...transacaoForm, tipo: e.target.value as TipoCategoria})}
                className="w-full bg-gray-700 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value={TipoCategoria.Entrada}>Entrada</option>
                <option value={TipoCategoria.Saida}>Saída</option>
                <option value={TipoCategoria.Investimento}>Investimento</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Valor</label>
              <CurrencyInput
                value={transacaoForm.valor}
                onValueChange={(v) => setTransacaoForm({...transacaoForm, valor: v})}
                placeholder="R$ 0,00"
                required
                className="w-full bg-gray-700 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Categoria</label>
            <select
              value={transacaoForm.categoria_id}
              onChange={(e) => setTransacaoForm({...transacaoForm, categoria_id: e.target.value})}
              required
              className="w-full bg-gray-700 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Selecione uma categoria</option>
              {categorias
                .filter(c => c.tipo === transacaoForm.tipo && !c.sistema)
                .map(categoria => (
                <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Descrição</label>
            <input
              type="text"
              value={transacaoForm.descricao}
              onChange={(e) => setTransacaoForm({...transacaoForm, descricao: e.target.value})}
              placeholder="Descrição da transação"
              required
              className="w-full bg-gray-700 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Data</label>
              <input
                type="date"
                value={transacaoForm.data}
                onChange={(e) => setTransacaoForm({...transacaoForm, data: e.target.value})}
                required
                className="w-full bg-gray-700 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex items-center justify-center">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={transacaoForm.realizado}
                  onChange={(e) => setTransacaoForm({...transacaoForm, realizado: e.target.checked})}
                  className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-offset-gray-800 focus:ring-green-500"
                />
                <span className="text-gray-300">Realizado</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Criar Transação
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AppSupabase;