import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import CategoriasPage from './CategoriasPage';
import ConfiguracoesPage from './ConfiguracoesPage';
import { Categoria, TransacaoBanco, CompraCartao, ModalState, ParcelaCartao } from '../types';

type PerfilTab = 'categorias' | 'configuracoes';

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
}

const PerfilPage: React.FC<PerfilPageProps> = (props) => {
  const [activeTab, setActiveTab] = useState<PerfilTab>('categorias');

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
            Categorias e Orçamentos
          </button>
          <button onClick={() => setActiveTab('configuracoes')} className={tabClasses('configuracoes')}>
            Configurações Gerais
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