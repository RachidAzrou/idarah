import { format } from "date-fns";
import { nl } from "date-fns/locale";

export function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: 'EUR',
  }).format(numAmount);
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy', { locale: nl });
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
