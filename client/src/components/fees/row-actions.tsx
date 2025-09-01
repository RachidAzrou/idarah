import { MoreHorizontal, Check, Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Fee } from "@shared/fees-schema";

interface RowActionsProps {
  fee: Fee;
  onAction: (action: string) => void;
}

export function RowActions({ fee, onAction }: RowActionsProps) {
  const canMarkPaid = fee.status === "OPEN" || fee.status === "OVERDUE";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          aria-label="Meer acties"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {canMarkPaid && (
          <DropdownMenuItem 
            onClick={() => onAction("markPaid")}
            className="flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            Markeer betaald
          </DropdownMenuItem>
        )}
        <DropdownMenuItem 
          onClick={() => onAction("viewDetail")}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          Bekijk detail
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onAction("changeMethod")}
          className="flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          Wijzig methode
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}