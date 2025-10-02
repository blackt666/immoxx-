export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium'
  }).format(new Date(date));
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value / 100);
}
