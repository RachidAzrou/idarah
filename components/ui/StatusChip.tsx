import { cn } from "@/lib/utils";

interface StatusChipProps {
  type: 'INCOME' | 'EXPENSE';
  className?: string;
}

export function StatusChip({ type, className }: StatusChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        type === 'INCOME'
          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
          : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
        className
      )}
    >
      {type === 'INCOME' ? 'Inkomsten' : 'Uitgaven'}
    </span>
  );
}