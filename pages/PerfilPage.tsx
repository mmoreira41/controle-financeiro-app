import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import CategoriasPage from './CategoriasPage';
import ConfiguracoesPage from './ConfiguracoesPage';
import { Categoria, TransacaoBanco, CompraCartao, ModalState, ParcelaCartao, Settings, NavigationState } from '../types';

type PerfilTab = 'categorias' | 'visualizacao' | 'configuracoes';

interface PerfilPageProps {
  // Props for CategoriasPage
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
  
  // Props for ConfiguracoesPage
  handleDeleteAllData: () => void;
  handleExportData: () => void;
  handleImportData: (file: File) => void;

  // New Props for Settings
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  navigationState: NavigationState | null;
  clearNavigationState: () => void;
}

const PerfilPage: React.FC<PerfilPageProps> = (props) => {
  const [activeTab, setActiveTab] = useState<PerfilTab>('categorias');

  useEffect(() => {
    if (props.navigationState?.viewId && ['categorias', 'visualizacao', 'configuracoes'].includes(props.navigationState.viewId)) {
        setActiveTab(props.navigationState.viewId as PerfilTab);
        props.clearNavigationState();
    }
  }, [props.navigationState, props.clearNavigationState]);

  const tabClasses = (tabName: PerfilTab) => 
    `px-4 py-2 font-semibold rounded-md transition-colors ${
      activeTab === tabName 
        ? 'bg-green-500 text-white' 
        : 'text-gray-300 hover:bg-gray-700'
    }`;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Perfil e Configurações"
        description="Gerencie suas categorias, orçamentos e dados do aplicativo."
      />

      <div className="mb-6 flex justify-center border-b border-gray-700">
        <div className="flex space-x-2">
          <button onClick={() => setActiveTab('categorias')} className={tabClasses('categorias')}>
            Categorias
          </button>
          <button onClick={() => setActiveTab('visualizacao')} className={tabClasses('visualizacao')}>
            Visualização
          </button>
          <button onClick={() => setActiveTab('configuracoes')} className={tabClasses('configuracoes')}>
            Dados do App
          </button>
        </div>
      </div>

      <div>
        {activeTab === 'categorias' && (
          <CategoriasPage
            categorias={props.categorias}
            transacoes={props.transacoes}
            compras={props.compras}
            parcelas={props.parcelas}
            addCategoria={props.addCategoria}
            updateCategoria={props.updateCategoria}
            deleteCategoria={props.deleteCategoria}
            modalState={props.modalState}
            openModal={props.openModal}
            closeModal={props.closeModal}
            selectedMonth={props.selectedMonth}
            onMonthChange={props.onMonthChange}
          />
        )}
        {activeTab === 'visualizacao' && (
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl mx-auto animate-fade-in">
                <h3 className="text-xl font-semibold text-white mb-4">Opções de Visualização</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                        <div>
                            <label htmlFor="show-percentage" className="font-medium text-white">Mostrar Variação Percentual</label>
                            <p className="text-sm text-gray-400">Exibe a mudança percentual nos cards da tela de Resumo.</p>
                        </div>
                        <label htmlFor="show-percentage" className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                id="show-percentage"
                                className="sr-only peer"
                                checked={props.settings.showPercentageChange}
                                onChange={() => props.setSettings(prev => ({ ...prev, showPercentageChange: !prev.showPercentageChange }))}
                            />
                            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-green-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                    </div>
                </div>
            </div>
        )}
        {activeTab === 'configuracoes' && (
          <ConfiguracoesPage
            handleDeleteAllData={props.handleDeleteAllData}
            handleExportData={props.handleExportData}
            handleImportData={props.handleImportData}
          />
        )}
      </div>
    </div>
  );
};

export default PerfilPage;