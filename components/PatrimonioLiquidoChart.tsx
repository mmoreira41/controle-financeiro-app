import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area } from 'recharts';
import { brMoney } from '../utils/format';

type ChartData = {
  mes: string;
  patrimonio: number;
};

interface PatrimonioLiquidoChartProps {
  data: ChartData[];
}

const PodeApagar: React.FC<PatrimonioLiquidoChartProps> = ({ data }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="font-bold text-white mb-2">{`Mês: ${label}`}</p>
          <div className="flex justify-between space-x-4" style={{ color: payload[0].color }}>
            <span>Patrimônio:</span>
            <span className="font-semibold">{brMoney.format(payload[0].value)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full min-h-[350px]">
        <h3 className="font-semibold text-white mb-4">Evolução do Patrimônio (12 meses)</h3>
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} stroke="#a1a1aa" />
                <XAxis dataKey="mes" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis 
                    stroke="#a1a1aa" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(v) => brMoney.format(v as number).replace('R$', '').trim()}
                    domain={['dataMin', 'dataMax']}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#a1a1aa', strokeWidth: 1, strokeDasharray: '3 3' }} />
                <defs>
                    <linearGradient id="colorPatrimonio" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <Area type="monotone" dataKey="patrimonio" stroke="#22c55e" fillOpacity={1} fill="url(#colorPatrimonio)" />
                <Line type="monotone" dataKey="patrimonio" stroke="#22c55e" strokeWidth={2} dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#1f2937' }} activeDot={{ r: 6 }} />
            </LineChart>
        </ResponsiveContainer>
    </div>
  );
};

export default PodeApagar;
