import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Transaction } from "@shared/schema";
import { formatCurrencyBE, formatDateBE, formatDateTime } from "@/lib/format";
import { User, Calendar, CreditCard, FileText, ArrowUpRight, ArrowDownLeft, X } from "lucide-react";

interface TransactionDetailDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (transaction: Transaction) => void;
}

export function TransactionDetailDialog({ transaction, open, onClose, onEdit }: TransactionDetailDialogProps) {
  if (!transaction) return null;

  const isIncome = transaction.type === "INCOME";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transactie Details</DialogTitle>
          <DialogDescription>
            Bekijk alle details van deze transactie
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {isIncome ? (
                  <ArrowUpRight className="h-5 w-5 text-green-600" />
                ) : (
                  <ArrowDownLeft className="h-5 w-5 text-red-600" />
                )}
                <Badge variant={isIncome ? "default" : "secondary"}>
                  {isIncome ? "Inkomst" : "Uitgave"}
                </Badge>
              </div>
              <span className="text-2xl font-bold">
                {formatCurrencyBE(transaction.amount)}
              </span>
            </div>
            <h3 className="font-semibold text-lg">
              {transaction.description}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {formatDateBE(transaction.date)}
            </p>
          </div>

          {/* Transaction Details */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Transactie informatie
            </h4>
            <div className="grid grid-cols-3 gap-6 text-sm">
              <div>
                <span className="text-gray-500">Type</span>
                <p className="font-medium">{isIncome ? "Inkomst" : "Uitgave"}</p>
              </div>
              <div>
                <span className="text-gray-500">Categorie</span>
                <p className="font-medium">{transaction.category}</p>
              </div>
              <div>
                <span className="text-gray-500">Bedrag</span>
                <p className="font-semibold text-lg">{formatCurrencyBE(transaction.amount)}</p>
              </div>
              <div>
                <span className="text-gray-500">Datum</span>
                <p className="font-medium">{formatDateBE(transaction.date)}</p>
              </div>
              {transaction.reference && (
                <div>
                  <span className="text-gray-500">Referentie</span>
                  <p className="font-mono text-xs">{transaction.reference}</p>
                </div>
              )}
              {transaction.paymentMethod && (
                <div>
                  <span className="text-gray-500">Betaalmethode</span>
                  <p className="font-medium">{transaction.paymentMethod}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Member Details */}
          {transaction.memberName && (
            <>
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Lid informatie
                </h4>
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <span className="text-gray-500">Naam</span>
                    <p className="font-medium">{transaction.memberName}</p>
                  </div>
                  {transaction.memberId && (
                    <div>
                      <span className="text-gray-500">Lid ID</span>
                      <p className="font-mono text-xs">{transaction.memberId}</p>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Notes */}
          {transaction.notes && (
            <>
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Opmerkingen
                </h4>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <p className="text-sm">{transaction.notes}</p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* System Info */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Systeem informatie
            </h4>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <span className="text-gray-500">Aangemaakt op</span>
                <p className="font-medium">{formatDateTime(transaction.createdAt)}</p>
              </div>
              {transaction.updatedAt && (
                <div>
                  <span className="text-gray-500">Laatst gewijzigd</span>
                  <p className="font-medium">{formatDateTime(transaction.updatedAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t">
            <div className="flex gap-3">
              {onEdit && (
                <Button 
                  onClick={() => {
                    onEdit(transaction);
                    onClose();
                  }}
                  className="flex-1"
                  data-testid="button-edit-transaction"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Bewerken
                </Button>
              )}
              <Button 
                onClick={onClose}
                variant="outline"
                className="flex-1"
                data-testid="button-close-detail"
              >
                <X className="h-4 w-4 mr-2" />
                Sluiten
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}