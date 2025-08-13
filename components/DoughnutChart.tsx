
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

// Consistent color palette
const COLORS = ['#4F7DFF','#FF6B6B','#22C55E','#F59E0B','#A855F7','#06B6D4','#F43F5E','#84CC16','#10B981','#EAB308','#EC4899','#60A5FA'];

type Row = { categoria: string; valor: number }; // value in BRL
type Props = {
  rows: Row[];
  onLegendClick?: (categoria: string) => void;
};

// BRL formatting helpers
const brlFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
const percentFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ChartDespesasDonut({ rows, onLegendClick }: Props) {
  // 1) Convert to cents to avoid floating point drift
  const { dataFinal, totalCents } = useMemo(() => {
    const cents = rows.map(r => ({ categoria: r.categoria, cents: Math.round(r.valor * 100) }))
                      .filter(r => r.cents > 0);

    const total = cents.reduce((s, r) => s + r.cents, 0);

    // Sort descending and group >12 into "Outras"
    const sorted = cents.sort((a, b) => b.cents - a.cents);
    const MAX = 12;
    const top = sorted.slice(0, MAX);
    const rest = sorted.slice(MAX).reduce((s, r) => s + r.cents, 0);
    const final = rest > 0 ? [...top, { categoria: 'Outras', cents: rest }] : top;

    return { dataFinal: final, totalCents: total };
  }, [rows]);

  const totalBRL = brlFormatter.format(totalCents / 100);

  // 2) Prepare dataset with consistent percentages everywhere
  const dataForChart = useMemo(() => {
    return dataFinal.map((d) => {
      const perc = totalCents > 0 ? (d.cents / totalCents) * 100 : 0;
      return {
        categoria: d.categoria,
        cents: d.cents,
        valor: d.cents / 100,
        perc,                  // raw number
        percStr: percentFormatter.format(perc) + '%', // PT-BR string
        valorStr: brlFormatter.format(d.cents / 100),
      };
    });
  }, [dataFinal, totalCents]);

  // 3) Custom clean tooltip with high z-index
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const p = payload[0]?.payload;
    return (
      <div className="z-[60] rounded-xl bg-slate-900/95 text-slate-100 px-3 py-2 shadow-xl border border-slate-700">
        <div className="font-semibold">{p.categoria}</div>
        <div>{p.valorStr} • {p.percStr}</div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
      {/* Donut Chart */}
      <div className="relative h-80">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={dataForChart}
              dataKey="valor"
              nameKey="categoria"
              innerRadius="70%"
              outerRadius="100%"
              minAngle={4}
              stroke="transparent"
              isAnimationActive={false}
            >
              {dataForChart.map((entry, i) => (
                <Cell key={entry.categoria} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Donut Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-slate-400 text-sm">Total de Despesas</span>
          <span className="text-white font-extrabold text-2xl">{totalBRL}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-3 overflow-auto pr-1 h-80 no-scrollbar">
        {dataForChart.map((d, i) => (
          <button
            key={d.categoria}
            onClick={() => onLegendClick?.(d.categoria)}
            className="flex items-center justify-between gap-4 px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-left w-full disabled:cursor-default disabled:hover:bg-slate-800/60"
            disabled={!onLegendClick || d.categoria === 'Outras'}
            title={d.categoria === 'Outras' ? 'Categoria agregada' : `Ver detalhes de ${d.categoria}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="inline-block w-3.5 h-3.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="truncate text-slate-100">{d.categoria}</span>
            </div>
            <div className="text-right shrink-0">
              <div className="text-slate-100 font-medium">{d.percStr}</div>
              <div className="text-slate-400 text-xs">{d.valorStr}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
