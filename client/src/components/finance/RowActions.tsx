"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { Transaction } from "@/lib/mock/transactions";

interface RowActionsProps {
  transaction: Transaction;
  onView: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
}

export function RowActions({ transaction, onView, onEdit, onDelete }: RowActionsProps) {
  const [open, setOpen] = useState(false);

  const handleAction = (action: () => void) => {
    action();
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={(e) => e.stopPropagation()}
          data-testid={`button-actions-${transaction.id}`}
        >
          <span className="sr-only">Acties openen</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem 
          onClick={(e) => {
            e.stopPropagation();
            handleAction(() => onView(transaction));
          }}
          data-testid={`menu-view-${transaction.id}`}
        >
          <Eye className="mr-2 h-4 w-4" />
          Details
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={(e) => {
            e.stopPropagation();
            handleAction(() => onEdit(transaction));
          }}
          data-testid={`menu-edit-${transaction.id}`}
        >
          <Edit className="mr-2 h-4 w-4" />
          Bewerken
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={(e) => {
            e.stopPropagation();
            handleAction(() => onDelete(transaction.id));
          }}
          className="text-red-600 dark:text-red-400"
          data-testid={`menu-delete-${transaction.id}`}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Verwijderen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}