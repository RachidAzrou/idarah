import { cn } from "@/lib/utils";

interface MethodChipProps {
  method: 'SEPA' | 'OVERSCHRIJVING' | 'BANCONTACT' | 'CASH';
  className?: string;
}

const methodConfig = {
  SEPA: {
    label: 'SEPA',
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
  },
  OVERSCHRIJVING: {
    label: 'Overschrijving',
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
  },
  BANCONTACT: {
    label: 'Bancontact',
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
  },
  CASH: {
    label: 'Contant',
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
  }
};

export function MethodChip({ method, className }: MethodChipProps) {
  const config = methodConfig[method];
  
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}