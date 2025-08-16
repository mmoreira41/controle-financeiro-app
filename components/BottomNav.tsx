import React, { useState, useEffect, useRef } from 'react';
import { Plus, ShoppingCart, DollarSign, ArrowUp, ArrowDown } from 'lucide-react';
import { Page } from '../types';
import { NAV_ITEMS } from '../constants';

interface BottomNavProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  onNewTransaction: () => void;
  onNewCardPurchase: () => void;
  hasAnyAccount: boolean;
  hasAnyCard: boolean;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentPage, setCurrentPage, onNewTransaction, onNewCardPurchase, hasAnyAccount, hasAnyCard }) => {
  const [isFabOpen, setFabOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);
  
  const navItemsForBar = [
    NAV_ITEMS.find(i => i.id === 'resumo'),
    NAV_ITEMS.find(i => i.id === 'contas-extrato'),
    NAV_ITEMS.find(i => i.id === 'cartoes'),
    NAV_ITEMS.find(i => i.id === 'investimentos'),
  ].filter(Boolean) as { id: Page; label: string; icon: React.ReactElement }[];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setFabOpen(false);
      }
    };
    if (isFabOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFabOpen]);

  const fabActions = [
    { label: 'Nova Transação', icon: <DollarSign size={20} />, action: onNewTransaction, disabled: !hasAnyAccount },
    { label: 'Compra no Cartão', icon: <ShoppingCart size={20} />, action: onNewCardPurchase, disabled: !hasAnyCard },
  ];
  
  return (
    <div ref={fabRef}>
      {/* Mobile Nav & FAB */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[calc(4.5rem+env(safe-area-inset-bottom))] bg-gray-800/80 backdrop-blur-sm border-t border-gray-700/50 z-40">
        <div className={`absolute bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-full flex justify-center items-center gap-4 transition-all duration-300 ${isFabOpen ? 'opacity-100' : 'opacity-0 pointer-events-none -translate-y-2'}`}>
          {fabActions.map(action => (
            <button key={action.label} onClick={() => { action.action(); setFabOpen(false); }} disabled={action.disabled} title={action.label} className="bg-gray-700 hover:bg-gray-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg disabled:bg-gray-600 disabled:opacity-50 relative">
              {action.icon}
              <div className="absolute bottom-1 right-1 flex bg-gray-900/50 p-0.5 rounded-full backdrop-blur-sm">
                <ArrowUp size={8} className="text-green-400" />
                <ArrowDown size={8} className="text-red-400" />
              </div>
            </button>
          ))}
        </div>
        <div className="flex justify-around items-center h-full px-2 pb-[env(safe-area-inset-bottom)]">
          {navItemsForBar.slice(0, 2).map(item => (
            <button key={item.id} onClick={() => setCurrentPage(item.id)} className="flex flex-col items-center justify-center w-1/5">
              <div className={`p-3 rounded-full transition-colors ${currentPage === item.id ? 'bg-green-500 text-white' : 'text-gray-400'}`}>
                {React.cloneElement(item.icon as React.ReactElement<{ size?: number }>, { size: 24 })}
              </div>
            </button>
          ))}
          <div className="w-1/5 flex justify-center">
              <button onClick={() => setFabOpen(!isFabOpen)} className="bg-green-500 hover:bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300">
                  <div style={{ transform: isFabOpen ? 'rotate(45deg)' : 'none' }} className="transition-transform duration-300">
                      <Plus size={32} />
                  </div>
              </button>
          </div>
          {navItemsForBar.slice(2, 4).map(item => (
            <button key={item.id} onClick={() => setCurrentPage(item.id)} className="flex flex-col items-center justify-center w-1/5">
              <div className={`p-3 rounded-full transition-colors ${currentPage === item.id ? 'bg-green-500 text-white' : 'text-gray-400'}`}>
                  {React.cloneElement(item.icon as React.ReactElement<{ size?: number }>, { size: 24 })}
              </div>
            </button>
          ))}
        </div>
      </nav>

      {/* Desktop FAB */}
      <div className="hidden md:block fixed bottom-8 right-8 z-40">
        <div className="flex flex-col items-center">
            <div className={`flex flex-col items-center gap-4 mb-4 transition-all duration-300 ${isFabOpen ? 'opacity-100' : 'opacity-0 pointer-events-none -translate-y-2'}`}>
              {fabActions.map(action => (
                <button key={action.label} onClick={() => { action.action(); setFabOpen(false); }} disabled={action.disabled} title={action.label} className="bg-gray-700 hover:bg-gray-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg disabled:bg-gray-600 disabled:opacity-50 relative">
                  {action.icon}
                  <div className="absolute bottom-1 right-1 flex bg-gray-900/50 p-0.5 rounded-full backdrop-blur-sm">
                    <ArrowUp size={8} className="text-green-400" />
                    <ArrowDown size={8} className="text-red-400" />
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setFabOpen(!isFabOpen)} className="bg-green-500 hover:bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300">
                <div style={{ transform: isFabOpen ? 'rotate(45deg)' : 'none' }} className="transition-transform duration-300">
                    <Plus size={32} />
                </div>
            </button>
        </div>
      </div>
    </div>
  );
};

export default BottomNav;