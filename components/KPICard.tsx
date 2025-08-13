
import React from 'react';
import { brMoney } from '../utils/format';
import { Landmark, ArrowUp, ArrowDown, CreditCard } from 'lucide-react';

const icons: { [key: string]: React.ReactNode } = {
    bank: <Landmark size={24} />,
    up: <ArrowUp size={24} />,
    down: <ArrowDown size={24} />,
    card: <CreditCard size={24} />
};

const iconColors: { [key: string]: string } = {
    bank: 'bg-blue-500/30 text-blue-300',
    up: 'bg-green-500/30 text-green-300',
    down: 'bg-red-500/30 text-red-300',
    card: 'bg-yellow-500/30 text-yellow-300'
}

export default function KPICard({label, value, icon, onClick}:{label:string;value:number;icon?:string;onClick:()=>void}) {
  return (
    <button 
        onClick={onClick} 
        aria-label={label}
        className="w-full text-left rounded-2xl bg-gray-800 p-4 hover:bg-gray-700 transition-colors group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500"
    >
      <div className="flex items-center space-x-4">
        {icon && (
          <div className={`p-3 rounded-full ${iconColors[icon] || 'bg-gray-600'}`}>
            {icons[icon]}
          </div>
        )}
        <div>
          <div className="text-gray-400 text-sm">{label}</div>
          <div className="text-2xl font-extrabold text-white mt-1">{brMoney.format(value)}</div>
        </div>
      </div>
    </button>
  );
}
