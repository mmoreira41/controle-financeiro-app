

import React from 'react';
import { Pencil } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { Page, NavigationState } from '../types';

type TransactionItem = {
    id: string;
    titulo: string;
    subtitulo: string;
    valor: number;
    status?: string;
    statusType: 'success' | 'warning' | 'info' | 'danger';
    kind: 'BANCO' | 'CARTAO';
    sourceId: string;
    type: 'compra' | 'transacao';
    original: any;
};

interface TransacoesRecentesCardProps {
    items: TransactionItem[];
    setCurrentPage: (page: Page, state?: NavigationState | null) => void;
    openModal: (modal: string, data?: any) => void;
}

const TransacoesRecentesCard: React.FC<TransacoesRecentesCardProps> = ({ items, setCurrentPage, openModal }) => {
    
    const handleTransactionClick = (item: TransactionItem) => {
      if (item.kind === 'CARTAO') {
          setCurrentPage('cartoes', { viewId: item.sourceId });
      } else {
          setCurrentPage('contas-extrato', { viewId: item.sourceId });
      }
    };
  
    const handleEditClick = (e: React.MouseEvent, item: TransactionItem) => {
        e.stopPropagation();
        if (item.type === 'compra') {
            openModal('editar-compra-cartao', { compra: item.original });
        } else {
            openModal('editar-transacao', { transacao: item.original });
        }
    };
    
    const getStatusChip = (status: string, type: string) => {
        const baseClasses = "px-2 py-0.5 text-xs font-semibold rounded-full capitalize";
        const colors = {
          success: 'bg-green-500/20 text-green-300',
          warning: 'bg-yellow-500/20 text-yellow-300',
          info: 'bg-blue-500/20 text-blue-300',
          danger: 'bg-red-500/20 text-red-300',
        };
        return <span className={`${baseClasses} ${colors[type as keyof typeof colors] || colors.info}`}>{status}</span>;
    }

    return (
        <div className="bg-gray-800 p-4 rounded-2xl h-full flex flex-col">
            <h3 className="text-xl font-semibold mb-4 text-white">Transações Recentes</h3>
            <div className="flex-grow overflow-y-auto space-y-3 no-scrollbar pr-2 min-h-[300px]">
                {items.length > 0 ? (
                    items.map(item => (
                        <div key={`${item.id}-${item.kind}`} onClick={() => handleTransactionClick(item)} className="flex items-center space-x-4 p-2.5 rounded-lg hover:bg-gray-700/50 cursor-pointer transition-colors">
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold text-white capitalize">{item.titulo}</p>
                                    <p className={`font-bold ${item.valor >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(item.valor)}</p>
                                </div>
                                <div className="flex justify-between items-center mt-1 text-sm text-gray-400">
                                    <span className="truncate pr-2">{item.subtitulo}</span>
                                    <div className="flex items-center space-x-2 flex-shrink-0">
                                        {item.status && getStatusChip(item.status, item.statusType)}
                                        <button onClick={(e) => handleEditClick(e, item)} className="text-gray-500 hover:text-blue-400 transition-colors">
                                            <Pencil size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        <p>Sem transações neste mês.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TransacoesRecentesCard;