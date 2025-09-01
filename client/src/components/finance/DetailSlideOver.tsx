"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusChip } from "@/components/ui/StatusChip";
import { MethodChip } from "@/components/ui/MethodChip";
import { formatDateBE, formatCurrencyBE } from "@/lib/format";
import { Transaction } from "@/lib/mock/transactions";
import { Edit, Trash2, User, Calendar, Tag, CreditCard, FileText } from "lucide-react";

interface DetailSlideOverProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
}

export function DetailSlideOver({
  open,
  onClose,
  transaction,
  onEdit,
  onDelete
}: DetailSlideOverProps) {
  if (!transaction) return null;

  const handleEdit = () => {
    onEdit(transaction);
    onClose();
  };

  const handleDelete = () => {
    onDelete(transaction.id);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <span className={transaction.type === 'INCOME' 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
            }>
              {formatCurrencyBE(transaction.amount)}
            </span>
            <StatusChip type={transaction.type} />
          </SheetTitle>
          <SheetDescription>
            Transactiedetails van {formatDateBE(transaction.date)}
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Basic Info */}
          <div className="grid gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <div className="text-sm font-medium">Datum</div>
                <div className="text-gray-600 dark:text-gray-400">
                  {formatDateBE(transaction.date)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <Tag className="h-5 w-5 text-gray-500" />
              <div>
                <div className="text-sm font-medium">Categorie</div>
                <div className="text-gray-600 dark:text-gray-400">
                  {transaction.category}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <CreditCard className="h-5 w-5 text-gray-500" />
              <div>
                <div className="text-sm font-medium">Betaalmethode</div>
                <div className="pt-1">
                  <MethodChip method={transaction.method} />
                </div>
              </div>
            </div>

            {transaction.memberName && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Lid</div>
                  <div className="text-blue-600 dark:text-blue-400">
                    {transaction.memberName}
                  </div>
                </div>
              </div>
            )}

            {transaction.description && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Omschrijving</div>
                  <div className="text-gray-600 dark:text-gray-400 mt-1">
                    {transaction.description}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Amount Display */}
          <div className="p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              {transaction.type === 'INCOME' ? 'Ontvangen bedrag' : 'Uitgegeven bedrag'}
            </div>
            <div className={`text-3xl font-bold ${
              transaction.type === 'INCOME' 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatCurrencyBE(transaction.amount)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button 
              onClick={handleEdit} 
              className="flex-1 gap-2"
              data-testid="button-edit-transaction"
            >
              <Edit className="h-4 w-4" />
              Bewerken
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDelete}
              className="flex-1 gap-2 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/10"
              data-testid="button-delete-transaction"
            >
              <Trash2 className="h-4 w-4" />
              Verwijderen
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}