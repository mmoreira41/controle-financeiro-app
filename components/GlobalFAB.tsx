import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, ShoppingCart, DollarSign } from 'lucide-react';

// The context prop defines all the contextual information the FAB needs.
type Context = {
  currentPage: string;
  selectedAccountId?: string | null;
  selectedCardId?: string | null;
  visibleYear: number;
  visibleMonth: number; // 1-12
  selectedDay?: number | null; // Optional, for pages like Fluxo de Caixa
  hasAnyAccount: boolean;
  hasAnyCard: boolean;
};

// The props for the FAB component.
type Props = {
  context: Context;
  openNewCardPurchase: (opts: { cardId?: string | null; dateISO: string; }) => void;
  openNewBankTransaction: (opts: { accountId?: string | null; dateISO: string; }) => void;
};

// Helper to format date parts into YYYY-MM-DD string.
function toISO(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

// Determines the default date for new entries based on context.
function getDefaultDateISO(ctx: Context): string {
  const now = new Date();
  const isVisibleMonthCurrent =
    ctx.visibleYear === now.getFullYear() && ctx.visibleMonth === (now.getMonth() + 1);

  // Prefill order: Selected day (from Fluxo) > 15th of a past/future month > Today.
  const day =
    typeof ctx.selectedDay === 'number' && ctx.selectedDay > 0
      ? ctx.selectedDay
      : isVisibleMonthCurrent
        ? now.getDate()
        : 15;

  return toISO(ctx.visibleYear, ctx.visibleMonth, day);
}

const GlobalFAB: React.FC<Props> = ({ context, openNewCardPurchase, openNewBankTransaction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  // Memoize the date calculation to avoid re-computing on every render.
  const dateISO = useMemo(() => getDefaultDateISO(context), [context]);

  // Effect to handle clicking outside the FAB to close it.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Effect to handle keyboard shortcuts (N for toggle, Escape for close).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Ignore shortcuts if user is typing in an input field.
      if (['input', 'textarea', 'select'].includes(target.tagName.toLowerCase())) return;
      
      if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const actions = [
    {
      label: 'Compra no Cartão',
      icon: <ShoppingCart size={20} />,
      action: () => {
        openNewCardPurchase({
          cardId: context.currentPage === 'cartoes' ? context.selectedCardId : null,
          dateISO,
        });
        setIsOpen(false);
      },
      disabled: !context.hasAnyCard,
      tooltip: !context.hasAnyCard ? 'Cadastre um cartão primeiro' : 'Registrar compra no cartão'
    },
    {
      label: 'Nova Transação',
      icon: <DollarSign size={20} />,
      action: () => {
        openNewBankTransaction({
          accountId: context.currentPage === 'contas-extrato' ? context.selectedAccountId : null,
          dateISO,
        });
        setIsOpen(false);
      },
      disabled: !context.hasAnyAccount,
      tooltip: !context.hasAnyAccount ? 'Cadastre uma conta primeiro' : 'Registrar transação (banco)'
    },
  ];

  return (
    <div
      ref={fabRef}
      aria-label="Ação rápida"
      aria-expanded={isOpen}
      className="fixed z-40"
      style={{
        right: 'max(24px, env(safe-area-inset-right))',
        bottom: 'max(24px, env(safe-area-inset-bottom))',
      }}
    >
      <div className={`flex flex-col items-end space-y-3 transition-all duration-200 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none -translate-y-2'}`}>
        {actions.map((item) => (
          <div key={item.label} className="flex items-center space-x-3">
            <span className="px-3 py-1.5 bg-gray-800 text-white text-sm font-medium rounded-md shadow-lg">
              {item.label}
            </span>
            <button
              onClick={item.action}
              disabled={item.disabled}
              title={item.tooltip}
              aria-label={item.tooltip}
              className="bg-gray-700 hover:bg-gray-600 text-white w-11 h-11 rounded-full flex items-center justify-center shadow-lg disabled:cursor-not-allowed disabled:bg-gray-800 disabled:text-gray-500 transition-colors"
            >
              {item.icon}
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl mt-4 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-400"
        aria-haspopup="true"
        aria-label={isOpen ? "Fechar ações rápidas" : "Abrir ações rápidas (atalho: N)"}
        title="Ações rápidas (N)"
      >
        <div className="transition-transform duration-300" style={{ transform: isOpen ? 'rotate(45deg)' : 'none' }}>
          <Plus size={28} />
        </div>
      </button>
    </div>
  );
};

export default GlobalFAB;
