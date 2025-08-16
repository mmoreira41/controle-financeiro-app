import React from 'react';
import { formatCurrency } from '../utils/format';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: number;
  change: number; // percentage change, e.g., 6.9 for +6.9%
  icon: React.ReactNode;
  onClick?: () => void;
  showPercentageChange?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, change, icon, onClick, showPercentageChange = false }) => {
  const isPositive = change >= 0;
  // Handle Infinity and NaN cases
  const isChangeFinite = isFinite(change);
  const changeText = isChangeFinite ? (isPositive ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`) : 'N/A';
  
  const cardClasses = `bg-gray-800 rounded-2xl p-4 flex flex-col justify-between h-36 ${onClick ? 'cursor-pointer hover:bg-gray-700/50 transition-colors' : ''}`;

  return (
    <div className={cardClasses} onClick={onClick}>
      <div className="flex items-center space-x-3 text-gray-400">
        {icon}
        <span className="font-medium text-sm">{title}</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{formatCurrency(value)}</p>
        {showPercentageChange && isChangeFinite && (
            <div className="flex items-center text-sm mt-1">
                <div className={`flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {isPositive ? <ArrowUp size={12} className="mr-1" /> : <ArrowDown size={12} className="mr-1" />}
                    <span>{changeText}</span>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;