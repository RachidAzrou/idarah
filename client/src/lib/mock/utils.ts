export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function formatDateBE(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-BE', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  });
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}