import React from 'react';
import Modal from './Modal';
import { Search, Landmark, CreditCard, ShoppingCart, ArrowRightLeft } from 'lucide-react';
import { ContaBancaria, Cartao, TransacaoBanco, CompraCartao } from '../types';
import { formatCurrency, formatDate } from '../utils/format';

interface SearchResults {
  contas: ContaBancaria[];
  cartoes: Cartao[];
  transacoes: TransacaoBanco[];
  compras: CompraCartao[];
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  results: SearchResults;
  onResultClick: (item: any, type: 'conta' | 'cartao' | 'transacao' | 'compra') => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, searchTerm, onSearchTermChange, results, onResultClick }) => {

  const hasResults = Object.values(results).some(arr => arr.length > 0);

  const renderResultItem = (item: any, type: 'conta' | 'cartao' | 'transacao' | 'compra') => {
    let icon, title, subtitle, value;
    switch (type) {
      case 'conta':
        icon = <Landmark size={20} className="text-blue-400" />;
        title = item.nome;
        subtitle = "Conta Bancária";
        break;
      case 'cartao':
        icon = <CreditCard size={20} className="text-purple-400" />;
        title = item.apelido;
        subtitle = "Cartão de Crédito";
        break;
      case 'transacao':
        icon = <ArrowRightLeft size={20} className="text-yellow-400" />;
        title = item.descricao;
        subtitle = `Transação em ${formatDate(item.data)}`;
        value = formatCurrency(item.tipo === 'Entrada' ? item.valor : -item.valor);
        break;
      case 'compra':
        icon = <ShoppingCart size={20} className="text-orange-400" />;
        title = item.descricao;
        subtitle = `Compra em ${formatDate(item.data_compra)}`;
        value = formatCurrency(item.estorno ? item.valor_total : -item.valor_total);
        break;
    }

    return (
      <button
        key={item.id}
        onClick={() => onResultClick(item, type)}
        className="w-full text-left p-3 flex items-center space-x-4 rounded-lg hover:bg-gray-700 transition-colors"
      >
        <div className="p-2 bg-gray-700/50 rounded-full">{icon}</div>
        <div className="flex-1 overflow-hidden">
          <p className="font-semibold text-white truncate">{title}</p>
          <p className="text-sm text-gray-400 truncate">{subtitle}</p>
        </div>
        {value && <p className={`font-mono font-semibold ${value.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>{value}</p>}
      </button>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Busca Global">
      <div className="flex flex-col h-[70vh]">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Pesquisar em todo o app..."
            value={searchTerm}
            onChange={e => onSearchTermChange(e.target.value)}
            className="w-full bg-gray-700 p-3 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
            autoFocus
          />
        </div>
        <div className="flex-grow overflow-y-auto space-y-4 pr-2">
          {searchTerm && !hasResults && (
            <div className="text-center text-gray-400 py-16">
              <p>Nenhum resultado encontrado para "{searchTerm}".</p>
            </div>
          )}
          
          {results.contas.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase px-3 mb-1">Contas</h4>
              {results.contas.map(item => renderResultItem(item, 'conta'))}
            </div>
          )}

          {results.cartoes.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase px-3 mb-1">Cartões</h4>
              {results.cartoes.map(item => renderResultItem(item, 'cartao'))}
            </div>
          )}

          {results.transacoes.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase px-3 mb-1">Transações</h4>
              {results.transacoes.map(item => renderResultItem(item, 'transacao'))}
            </div>
          )}

          {results.compras.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase px-3 mb-1">Compras no Cartão</h4>
              {results.compras.map(item => renderResultItem(item, 'compra'))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SearchModal;