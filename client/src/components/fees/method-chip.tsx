import { cn } from "@/lib/utils";
import { PaymentMethod } from "@shared/fees-schema";
import { CreditCard, Building, Smartphone, Banknote } from "lucide-react";

interface MethodChipProps {
  method: PaymentMethod;
  className?: string;
  showIcon?: boolean;
}

export function MethodChip({ method, className, showIcon = true }: MethodChipProps) {
  const variants = {
    SEPA: "bg-purple-100 text-purple-800 border-purple-200",
    OVERSCHRIJVING: "bg-blue-100 text-blue-800 border-blue-200",
    BANCONTACT: "bg-orange-100 text-orange-800 border-orange-200",
    CASH: "bg-gray-100 text-gray-800 border-gray-200",
  };

  const labels = {
    SEPA: "SEPA",
    OVERSCHRIJVING: "Overschrijving",
    BANCONTACT: "Bancontact",
    CASH: "Contant",
  };

  const icons = {
    SEPA: CreditCard,
    OVERSCHRIJVING: Building,
    BANCONTACT: Smartphone,
    CASH: Banknote,
  };

  const Icon = icons[method];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variants[method],
        className
      )}
    >
      {showIcon && Icon && <Icon className="h-3 w-3" />}
      {labels[method]}
    </span>
  );
}