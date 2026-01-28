export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function formatNumber(value: number, decimals = 1): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  }).format(value);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  }).format(d);
}

export function formatDateFull(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short'
  }).format(d);
}

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  combustivel: 'Combustível',
  manutencao: 'Manutenção',
  alimentacao: 'Alimentação',
  seguro: 'Seguro',
  aluguel: 'Aluguel',
  internet: 'Internet',
  pedagio_estacionamento: 'Pedágio/Estac.',
  outros: 'Outros'
};

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  corrida: 'Corrida',
  entrega: 'Entrega',
  outro: 'Outro'
};

export const EARNING_TYPE_LABELS: Record<string, string> = {
  corrida_entrega: 'Corrida/Entrega',
  gorjeta: 'Gorjeta',
  bonus: 'Bônus',
  ajuste: 'Ajuste'
};

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  imediato: 'Imediato',
  app: 'Via App'
};
