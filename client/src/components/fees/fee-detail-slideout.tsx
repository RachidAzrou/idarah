import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Fee } from "@shared/fees-schema";
import { formatCurrencyBE, formatDateBE, formatPeriodBE } from "@/lib/format";
import { StatusChip } from "./status-chip";
import { MethodChip } from "./method-chip";
import { User, Calendar, CreditCard, FileText, Check, X } from "lucide-react";

interface FeeDetailSlideoutProps {
  fee: Fee | null;
  open: boolean;
  onClose: () => void;
  onMarkPaid: (fee: Fee) => void;
}

export function FeeDetailSlideout({ fee, open, onClose, onMarkPaid }: FeeDetailSlideoutProps) {
  if (!fee) return null;

  const canMarkPaid = fee.status === "OPEN" || fee.status === "OVERDUE";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lidgeld Detail</DialogTitle>
          <DialogDescription>
            Bekijk alle details van dit lidgeld
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-sm text-muted-foreground">#{fee.memberNumber}</span>
              <StatusChip status={fee.status} />
            </div>
            <h3 className="font-semibold text-lg">
              {fee.memberLastName}, {fee.memberFirstName}
            </h3>
            <p className="text-muted-foreground">
              {formatPeriodBE(fee.periodStart, fee.periodEnd)}
            </p>
          </div>

          {/* Financial Details */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Financiële details
            </h4>
            <div className="grid grid-cols-3 gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Bedrag</span>
                <p className="font-semibold text-lg">{formatCurrencyBE(fee.amount)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Methode</span>
                <div className="mt-1">
                  <MethodChip method={fee.method} />
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Vervaldatum</span>
                <p className="font-medium">{formatDateBE(fee.dueDate)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Categorie</span>
                <p className="font-medium">{fee.category}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Member Details */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Lid informatie
            </h4>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Naam</span>
                <p className="font-medium">{fee.memberFirstName} {fee.memberLastName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Lidnummer</span>
                <p className="font-mono">{fee.memberNumber}</p>
              </div>
              <div>
                <span className="text-muted-foreground">E-mail</span>
                <p>{fee.memberEmail}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Telefoon</span>
                <p>{fee.memberPhone}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Details */}
          {fee.status === "PAID" && fee.paidAt && (
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Check className="h-4 w-4" />
                Betaling details
              </h4>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Betaald op</span>
                  <p className="font-medium">{formatDateBE(fee.paidAt)}</p>
                </div>
                {fee.transactionId && (
                  <div>
                    <span className="text-muted-foreground">Transactie ID</span>
                    <p className="font-mono text-xs">{fee.transactionId}</p>
                  </div>
                )}
                {fee.reference && (
                  <div>
                    <span className="text-muted-foreground">Referentie</span>
                    <p className="font-mono text-xs">{fee.reference}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {fee.notes && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Opmerkingen
                </h4>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm">{fee.notes}</p>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="pt-6">
            <div className="flex gap-3">
              {canMarkPaid && (
                <Button 
                  onClick={() => onMarkPaid(fee)}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Markeer betaald
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}