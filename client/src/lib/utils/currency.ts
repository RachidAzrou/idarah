export function formatCurrencyShortEUR(amount: number, locale = 'nl-BE'): string {
  if (amount >= 1000000) {
    return `€${(amount / 1000000).toFixed(1).replace('.0', '')}M`;
  }
  if (amount >= 1000) {
    return `€${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1).replace('.0', '')}k`;
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}