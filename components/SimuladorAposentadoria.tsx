import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { formatCurrency } from '../utils/format';

interface SliderInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    min: number;
    max: number;
    step: number;
    unit: string;
    isCurrency?: boolean;
}

const SliderInput: React.FC<SliderInputProps> = ({ label, value, onChange, min, max, step, unit, isCurrency = false }) => {
    const numericValue = isCurrency ? (parseFloat(value) / 100 || 0) : parseFloat(value) || 0;

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange(isCurrency ? String(parseFloat(val) * 100) : val);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange(isCurrency ? val.replace(/[^0-9]/g, '') : val);
    };

    return (
        <div>
            <label className="flex justify-between items-baseline text-sm font-medium text-gray-300 mb-2">
                <span>{label}</span>
                <span className="font-bold text-lg text-white">{isCurrency ? formatCurrency(numericValue) : `${numericValue} ${unit}`}</span>
            </label>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={numericValue}
                onChange={handleSliderChange}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-thumb"
            />
            <style>{`
                .range-thumb::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    background: #22c55e;
                    cursor: pointer;
                    border-radius: 50%;
                    border: 3px solid #1f2937;
                }
                .range-thumb::-moz-range-thumb {
                    width: 14px;
                    height: 14px;
                    background: #22c55e;
                    cursor: pointer;
                    border-radius: 50%;
                    border: 3px solid #1f2937;
                }
            `}</style>
        </div>
    );
};


const PodeApagar: React.FC = () => {
    const [valorInicial, setValorInicial] = useState('100000'); // R$ 1000.00
    const [aporteMensal, setAporteMensal] = useState('50000');   // R$ 500.00
    const [taxaAnual, setTaxaAnual] = useState('8');           // 8%
    const [periodoAnos, setPeriodoAnos] = useState('20');       // 20 anos

    const { valorFinal, totalAportado, totalJuros, graficoData } = useMemo(() => {
        const vi = (parseFloat(valorInicial) / 100) || 0;
        const vm = (parseFloat(aporteMensal) / 100) || 0;
        const tj = parseFloat(taxaAnual) || 0;
        const pa = parseInt(periodoAnos, 10) || 0;

        if (pa <= 0 || tj <= 0) {
            return { valorFinal: vi, totalAportado: vi, totalJuros: 0, graficoData: [{ ano: 0, 'Valor Acumulado': vi, 'Valor Aportado': vi }] };
        }

        const taxaMensal = Math.pow(1 + tj / 100, 1 / 12) - 1;
        const periodoMeses = pa * 12;

        let valorAcumulado = vi;
        let totalInvestido = vi;
        const data = [{ ano: 0, 'Valor Acumulado': valorAcumulado, 'Valor Aportado': totalInvestido }];

        for (let i = 1; i <= periodoMeses; i++) {
            valorAcumulado += vm;
            totalInvestido += vm;
            valorAcumulado *= (1 + taxaMensal);

            if (i % 12 === 0 || i === periodoMeses) {
                data.push({
                    ano: Math.ceil(i / 12),
                    'Valor Acumulado': parseFloat(valorAcumulado.toFixed(2)),
                    'Valor Aportado': parseFloat(totalInvestido.toFixed(2)),
                });
            }
        }

        return {
            valorFinal: valorAcumulado,
            totalAportado: totalInvestido,
            totalJuros: valorAcumulado - totalInvestido,
            graficoData: data,
        };
    }, [valorInicial, aporteMensal, taxaAnual, periodoAnos]);
    
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-3 shadow-lg">
                    <p className="font-bold text-white mb-2">{`Ano: ${label}`}</p>
                    <p style={{ color: payload[0]?.color || '#fff' }}>{`${payload[0]?.name}: ${formatCurrency(payload[0]?.value)}`}</p>
                    <p style={{ color: payload[1]?.color || '#fff' }}>{`${payload[1]?.name}: ${formatCurrency(payload[1]?.value)}`}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
            <h3 className="text-2xl font-bold text-white mb-6 text-center md:text-left">Simulador de Aposentadoria</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6 bg-gray-900/50 p-6 rounded-lg">
                    <SliderInput label="Valor Inicial" value={valorInicial} onChange={setValorInicial} min={0} max={100000} step={1000} unit="R$" isCurrency />
                    <SliderInput label="Aporte Mensal" value={aporteMensal} onChange={setAporteMensal} min={0} max={5000} step={50} unit="R$" isCurrency />
                    <SliderInput label="Taxa de Juros Anual" value={taxaAnual} onChange={setTaxaAnual} min={1} max={20} step={0.5} unit="%" />
                    <SliderInput label="Período" value={periodoAnos} onChange={setPeriodoAnos} min={1} max={40} step={1} unit="anos" />
                </div>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-green-500/10 border border-green-500/30 text-white p-4 rounded-lg text-center">
                            <p className="text-sm font-medium text-green-300">Valor Final</p>
                            <p className="text-2xl font-bold">{formatCurrency(valorFinal)}</p>
                        </div>
                         <div className="bg-gray-700 p-4 rounded-lg text-center">
                            <p className="text-sm font-medium text-gray-400">Total Aportado</p>
                            <p className="text-2xl font-bold">{formatCurrency(totalAportado)}</p>
                        </div>
                        <div className="bg-gray-700 p-4 rounded-lg text-center">
                            <p className="text-sm font-medium text-gray-400">Total em Juros</p>
                            <p className="text-2xl font-bold">{formatCurrency(totalJuros)}</p>
                        </div>
                    </div>
                    <div className="w-full h-80 bg-gray-900/50 p-4 rounded-lg">
                        <ResponsiveContainer>
                            <AreaChart data={graficoData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} stroke="#a1a1aa" />
                                <XAxis dataKey="ano" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v as number).replace(/\s/g, '')} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{fontSize: "14px"}}/>
                                <Area type="monotone" dataKey="Valor Acumulado" stroke="#22c55e" fillOpacity={1} fill="url(#colorUv)" strokeWidth={2}/>
                                <Area type="monotone" dataKey="Valor Aportado" stroke="#6b7280" strokeDasharray="5 5" fill="transparent" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PodeApagar;
