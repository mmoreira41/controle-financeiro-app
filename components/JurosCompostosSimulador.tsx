import React, { useState } from 'react';
import CurrencyInput from './CurrencyInput';
import { formatCurrency } from '../utils/format';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const JurosCompostosSimulador: React.FC = () => {
    const [valorInicial, setValorInicial] = useState('');
    const [valorMensal, setValorMensal] = useState('');
    const [taxaJuros, setTaxaJuros] = useState('');
    const [tipoTaxa, setTipoTaxa] = useState<'anual' | 'mensal'>('anual');
    const [periodo, setPeriodo] = useState('');
    const [tipoPeriodo, setTipoPeriodo] = useState<'anos' | 'meses'>('anos');

    const [resultado, setResultado] = useState<{ valorFinal: number; totalInvestido: number; totalJuros: number; graficoData: any[] } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleCalcular = () => {
        const vi = parseFloat(valorInicial) / 100 || 0;
        const vm = parseFloat(valorMensal) / 100 || 0;
        let tj = parseFloat(taxaJuros) || 0;
        let p = parseInt(periodo, 10) || 0;

        if (vi <= 0 || vm < 0 || tj <= 0 || p <= 0) {
            setError('Preencha todos os campos com valores válidos para calcular.');
            setResultado(null);
            return;
        }
        setError(null);

        const taxaMensal = tipoTaxa === 'anual' ? Math.pow(1 + tj / 100, 1 / 12) - 1 : tj / 100;
        const periodoMeses = tipoPeriodo === 'anos' ? p * 12 : p;

        let valorAcumulado = vi;
        let totalInvestido = vi;
        const data = [{ mes: 0, 'Valor Acumulado': valorAcumulado, 'Total Investido': totalInvestido }];

        for (let i = 1; i <= periodoMeses; i++) {
            valorAcumulado *= (1 + taxaMensal);
            valorAcumulado += vm;
            totalInvestido += vm;
            if (i % 12 === 0 || i === periodoMeses) {
                 data.push({
                    mes: i,
                    'Valor Acumulado': parseFloat(valorAcumulado.toFixed(2)),
                    'Total Investido': parseFloat(totalInvestido.toFixed(2)),
                });
            }
        }
        
        setResultado({
            valorFinal: valorAcumulado,
            totalInvestido: totalInvestido,
            totalJuros: valorAcumulado - totalInvestido,
            graficoData: data,
        });
    };

    const handleLimpar = () => {
        setValorInicial('');
        setValorMensal('');
        setTaxaJuros('');
        setPeriodo('');
        setResultado(null);
        setError(null);
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-3 shadow-lg">
                    <p className="font-bold text-white mb-2">{`Mês: ${label}`}</p>
                    <p style={{ color: payload[0]?.color || '#fff' }}>{`${payload[0]?.name}: ${formatCurrency(payload[0]?.value)}`}</p>
                    <p style={{ color: payload[1]?.color || '#fff' }}>{`${payload[1]?.name}: ${formatCurrency(payload[1]?.value)}`}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="space-y-4 bg-gray-900/50 p-6 rounded-lg">
                    <div>
                        <label htmlFor="valor-inicial" className="block text-sm font-medium text-gray-300 mb-1">Valor Inicial (R$)</label>
                        <CurrencyInput id="valor-inicial" value={valorInicial} onValueChange={setValorInicial} placeholder="R$ 0,00" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"/>
                    </div>
                    <div>
                        <label htmlFor="valor-mensal" className="block text-sm font-medium text-gray-300 mb-1">Valor Mensal (R$)</label>
                        <CurrencyInput id="valor-mensal" value={valorMensal} onValueChange={setValorMensal} placeholder="R$ 0,00" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"/>
                    </div>
                    <div>
                        <label htmlFor="taxa-juros" className="block text-sm font-medium text-gray-300 mb-1">Taxa de Juros</label>
                        <div className="flex">
                            <input id="taxa-juros" type="number" value={taxaJuros} onChange={e => setTaxaJuros(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-l-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="Ex: 8.5" />
                            <select value={tipoTaxa} onChange={e => setTipoTaxa(e.target.value as any)} className="bg-gray-600 border border-gray-600 rounded-r-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500">
                                <option value="anual">anual</option>
                                <option value="mensal">mensal</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="periodo" className="block text-sm font-medium text-gray-300 mb-1">Período</label>
                        <div className="flex">
                            <input id="periodo" type="number" value={periodo} onChange={e => setPeriodo(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-l-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="Ex: 20" />
                            <select value={tipoPeriodo} onChange={e => setTipoPeriodo(e.target.value as any)} className="bg-gray-600 border border-gray-600 rounded-r-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500">
                                <option value="anos">ano(s)</option>
                                <option value="meses">meses</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4 pt-2">
                        <button onClick={handleCalcular} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">Calcular</button>
                        <button onClick={handleLimpar} className="text-gray-400 hover:text-white text-sm font-medium transition-colors whitespace-nowrap">Limpar</button>
                    </div>
                </div>
                <div className="space-y-4">
                    {error && <p className="text-yellow-400 text-center">{error}</p>}
                    {resultado && (
                        <div className="animate-fade-in space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-green-500/10 border border-green-500/30 text-white p-4 rounded-lg text-center">
                                    <p className="text-sm font-medium text-green-300">Valor Final</p>
                                    <p className="text-xl font-bold">{formatCurrency(resultado.valorFinal)}</p>
                                </div>
                                <div className="bg-gray-700 p-4 rounded-lg text-center">
                                    <p className="text-sm font-medium text-gray-400">Total Aportado</p>
                                    <p className="text-xl font-bold">{formatCurrency(resultado.totalInvestido)}</p>
                                </div>
                                <div className="bg-gray-700 p-4 rounded-lg text-center">
                                    <p className="text-sm font-medium text-gray-400">Total em Juros</p>
                                    <p className="text-xl font-bold">{formatCurrency(resultado.totalJuros)}</p>
                                </div>
                            </div>
                             <div className="w-full h-80 bg-gray-900/50 p-4 rounded-lg">
                                <ResponsiveContainer>
                                    <LineChart data={resultado.graficoData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} stroke="#a1a1aa" />
                                        <XAxis dataKey="mes" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Meses', position: 'insideBottom', offset: -5 }}/>
                                        <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v as number).replace(/\s/g, '')} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{fontSize: "14px"}}/>
                                        <Line type="monotone" dataKey="Valor Acumulado" stroke="#22c55e" strokeWidth={2}/>
                                        <Line type="monotone" dataKey="Total Investido" stroke="#6b7280" strokeDasharray="5 5" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JurosCompostosSimulador;