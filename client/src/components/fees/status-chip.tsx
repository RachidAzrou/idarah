import { cn } from "@/lib/utils";
import { FeeStatus } from "@shared/fees-schema";

interface StatusChipProps {
  status: FeeStatus;
  className?: string;
}

export function StatusChip({ status, className }: StatusChipProps) {
  const variants = {
    OPEN: "bg-blue-100 text-blue-800 border-blue-200",
    PAID: "bg-green-100 text-green-800 border-green-200", 
    OVERDUE: "bg-red-100 text-red-800 border-red-200",
  };

  const labels = {
    OPEN: "Openstaand",
    PAID: "Betaald",
    OVERDUE: "Achterstallig",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variants[status],
        className
      )}
    >
      {labels[status]}
    </span>
  );
}