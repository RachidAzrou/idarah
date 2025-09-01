import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: 'ACTIEF' | 'INACTIEF';
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const isActive = status === 'ACTIEF';
  
  return (
    <Badge
      variant="secondary"
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full",
        isActive 
          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-50" 
          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-50",
        className
      )}
    >
      <div 
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          isActive ? "bg-green-500" : "bg-gray-400"
        )} 
      />
      {status === 'ACTIEF' ? 'Actief' : 'Inactief'}
    </Badge>
  );
}