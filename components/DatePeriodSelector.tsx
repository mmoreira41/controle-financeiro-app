import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePeriodSelectorProps {
    selectedMonth: string; // YYYY-MM
    onMonthChange: (newMonth: string) => void;
}

const ALL_MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const DatePeriodSelector: React.FC<DatePeriodSelectorProps> = ({ selectedMonth, onMonthChange }) => {
    const { year, monthIndex } = useMemo(() => {
        const [y, m] = selectedMonth.split('-').map(Number);
        return { year: y, monthIndex: m - 1 };
    }, [selectedMonth]);

    const changeYear = (newYear: number) => {
        onMonthChange(`${newYear}-${String(monthIndex + 1).padStart(2, '0')}`);
    };

    const navigateMonth = (offset: number) => {
        const currentDate = new Date(year, monthIndex, 15);
        currentDate.setMonth(currentDate.getMonth() + offset);
        const newYear = currentDate.getFullYear();
        const newMonth = currentDate.getMonth() + 1;
        onMonthChange(`${newYear}-${String(newMonth).padStart(2, '0')}`);
    };

    const getMonthLabel = (offset: number) => {
        const d = new Date(year, monthIndex + offset, 1);
        return ALL_MONTHS[d.getMonth()];
    };

    return (
        <div className="flex flex-col items-center space-y-3">
            {/* Year Selector */}
            <div className="flex items-center space-x-6 text-xl font-medium text-gray-400">
                <button onClick={() => changeYear(year - 1)} className="hover:text-white transition-colors">{year - 1}</button>
                <span className="text-white font-bold text-2xl">{year}</span>
                <button onClick={() => changeYear(year + 1)} className="hover:text-white transition-colors">{year + 1}</button>
            </div>
            {/* Month Selector */}
            <div className="flex items-center space-x-2">
                <button onClick={() => navigateMonth(-1)} className="p-2 rounded-full text-gray-400 hover:bg-gray-700/50 hover:text-white transition-colors" aria-label="Mês anterior">
                    <ChevronLeft size={20} />
                </button>
                <div className="flex items-center space-x-2">
                    <button onClick={() => navigateMonth(-1)} className="px-4 py-2 rounded-full bg-gray-800 hover:bg-gray-700 w-28 text-center text-gray-300 transition-colors">{getMonthLabel(-1)}</button>
                    <button onClick={() => navigateMonth(0)} className="px-4 py-2 rounded-full bg-green-500 text-white font-semibold w-28 text-center shadow-lg">{getMonthLabel(0)}</button>
                    <button onClick={() => navigateMonth(1)} className="px-4 py-2 rounded-full bg-gray-800 hover:bg-gray-700 w-28 text-center text-gray-300 transition-colors">{getMonthLabel(1)}</button>
                </div>
                <button onClick={() => navigateMonth(1)} className="p-2 rounded-full text-gray-400 hover:bg-gray-700/50 hover:text-white transition-colors" aria-label="Próximo mês">
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
};

export default DatePeriodSelector;
