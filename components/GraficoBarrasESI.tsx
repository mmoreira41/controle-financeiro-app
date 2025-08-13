
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { brMoney } from '../utils/format';

type ChartData = {
  mes: string;
  entradas: number;
  saidas: number;
  investimentos: number;
};

interface GraficoBarrasESIProps {
  data: ChartData[];
}

export default function GraficoBarrasESI({ data }: GraficoBarrasESIProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="font-bold text-white mb-2">{`Mês: ${label}`}</p>
          {payload.map((pld: any) => (
            <div key={pld.dataKey} style={{ color: pld.color }} className="flex justify-between space-x-4">
              <span>{pld.name}:</span>
              <span className="font-semibold">{brMoney.format(pld.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl bg-gray-800 p-4 h-full flex flex-col">
      <div className="font-semibold text-white mb-4">Entradas x Saídas x Investimentos (5 meses)</div>
      <div className="flex-grow h-72 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} stroke="#a1a1aa" />
            <XAxis dataKey="mes" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis 
                stroke="#a1a1aa" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(v) => brMoney.format(v as number).replace('R$', '').trim()}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }} />
            <Legend wrapperStyle={{fontSize: "14px", paddingTop: "15px"}} />
            <Bar dataKey="entradas" name="Entradas" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="saidas" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="investimentos" name="Investimentos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
