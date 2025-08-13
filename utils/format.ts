
export const brMoney = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

// Formata um número para o padrão de moeda BRL (R$ 1.234,56)
export const formatCurrency = (value: number): string => {
  return brMoney.format(value);
};

// Formata uma data no formato YYYY-MM-DD para DD/MM/YYYY
export const formatDate = (dateString: string): string => {
  try {
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return dateString;
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateString;
  }
};

// Analisa uma string de moeda BRL (ex: "1.234,56") e converte para um número.
export const parseCurrency = (value: string): number => {
    if (typeof value !== 'string' || value.trim() === '') {
        return 0;
    }
    // Remove R$, spaces, and thousand separators, then replace comma with dot.
    const cleanedValue = value.replace(/[R$\s.]/g, '').replace(',', '.');
    const number = parseFloat(cleanedValue);
    return isNaN(number) ? 0 : number;
};

export function roundHalfUp(n: number, decimals = 2) {
  const f = 10 ** decimals;
  return Math.round((n + Number.EPSILON) * f) / f;
}

export function computeFirstCompetency(dateCompra: Date, diaFechamento: number): {year: number; month: number} {
  const y = dateCompra.getUTCFullYear();
  const m = dateCompra.getUTCMonth(); // 0..11
  const diaCompra = dateCompra.getUTCDate();
  if (diaCompra <= diaFechamento) return { year: y, month: m }; // current month
  const d = new Date(Date.UTC(y, m + 1, 1)); // next month
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
}

export function addMonths(year: number, month: number, n: number): {year: number; month: number} {
  const d = new Date(Date.UTC(year, month + n, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
}

export function ymToISOFirstDay(year: number, month0: number) {
  const y = year, m = month0 + 1;
  return `${y}-${String(m).padStart(2,'0')}-01`;
}

export function splitInstallments(total: number, n: number): number[] {
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / n);
  const resto = cents - base * n;
  const arr = Array(n).fill(base);
  for (let i = 0; i < resto; i++) arr[i] += 1; // distribute remaining cents
  return arr.map(c => roundHalfUp(c / 100, 2));
}