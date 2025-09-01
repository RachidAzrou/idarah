import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

export function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: 'EUR',
  }).format(numAmount);
}

// Belgian currency formatting
export function formatCurrencyBE(amount: number): string {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

// IBAN formatting
export function formatIban(iban: string): string {
  if (!iban) return "";
  // Remove spaces and group in blocks of 4
  const cleaned = iban.replace(/\s/g, "");
  return cleaned.match(/.{1,4}/g)?.join(" ") || iban;
}

// Percentage formatting
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat("nl-BE", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

// Number formatting
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("nl-BE").format(value);
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy', { locale: nl });
}

// Belgian date formatting with dashes
export function formatDateBE(date: string | Date): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "dd-MM-yyyy", { locale: nl });
}

export function formatDateTimeBE(date: string | Date): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "dd-MM-yyyy HH:mm", { locale: nl });
}

export function formatPeriodBE(startDate: string | Date, endDate: string | Date): string {
  const start = typeof startDate === "string" ? parseISO(startDate) : startDate;
  const end = typeof endDate === "string" ? parseISO(endDate) : endDate;
  return `${format(start, "dd-MM-yyyy", { locale: nl })} — ${format(end, "dd-MM-yyyy", { locale: nl })}`;
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: nl });
}

export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Vandaag';
  if (diffInDays === 1) return 'Gisteren';
  if (diffInDays < 7) return `${diffInDays} dagen geleden`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weken geleden`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} maanden geleden`;
  return `${Math.floor(diffInDays / 365)} jaar geleden`;
}

export function getMemberCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'STUDENT': 'Student',
    'VOLWASSEN': 'Volwassen',
    'SENIOR': 'Senior',
  };
  return labels[category] || category;
}

export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    'SEPA': 'SEPA Incasso',
    'OVERSCHRIJVING': 'Overschrijving',
    'BANCONTACT': 'Bancontact',
    'CASH': 'Contant',
  };
  return labels[method] || method;
}

export function getFeeStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'OPEN': 'Openstaand',
    'PAID': 'Betaald',
    'OVERDUE': 'Achterstallig',
  };
  return labels[status] || status;
}
