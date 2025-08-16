import React, { useState } from 'react';
import DoughnutChart from './DoughnutChart';
import GraficoBarrasESI from './GraficoBarrasESI';

type DoughnutData = { categoria: string; valor: number };
type BarData = { mes: string; entradas: number; saidas: number; investimentos: number; };

interface ChartContainerProps {
  despesasData: DoughnutData[];
  evolucaoData: BarData[];
}

const ChartContainer: React.FC<ChartContainerProps> = ({ despesasData, evolucaoData }) => {
  const [activeTab, setActiveTab] = useState<'categorias' | 'evolucao'>('categorias');

  const tabButtonClasses = (isActive: boolean) => 
    `px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
      isActive ? 'bg-green-500 text-white' : 'text-gray-300 hover:bg-gray-600/50'
    }`;

  return (
    <div className="bg-gray-800 p-4 rounded-2xl h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-white">
          {activeTab === 'categorias' ? 'Despesas por Categoria' : 'Evolução Mensal'}
        </h3>
        <div className="flex space-x-1 bg-gray-700/80 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('categorias')} 
            className={tabButtonClasses(activeTab === 'categorias')}
          >
            Categorias
          </button>
          <button 
            onClick={() => setActiveTab('evolucao')} 
            className={tabButtonClasses(activeTab === 'evolucao')}
          >
            Evolução
          </button>
        </div>
      </div>
      <div className="flex-grow">
        {activeTab === 'categorias' && <DoughnutChart rows={despesasData} />}
        {activeTab === 'evolucao' && <GraficoBarrasESI data={evolucaoData} />}
      </div>
    </div>
  );
};

export default ChartContainer;