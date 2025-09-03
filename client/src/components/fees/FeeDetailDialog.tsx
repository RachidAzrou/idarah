import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Calendar, 
  Euro, 
  CreditCard, 
  Check, 
  Download, 
  Trash2, 
  X, 
  User,
  Phone,
  Mail,
  Info
} from "lucide-react";
import { format, addDays } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { nl } from "date-fns/locale";

// Types
type FeeStatus = "OPENSTAAND" | "BETAALD" | "VERVALLEN";
type PaymentTerm = "MONTHLY" | "YEARLY";
type PaymentMethod = "SEPA" | "OVERSCHRIJVING" | "BANCONTACT" | "CASH" | "UNKNOWN";

type MemberMini = {
  id: string;
  firstName: string;
  lastName: string;
  category: "STUDENT" | "STANDAARD" | "SENIOR";
  email?: string | null;
  phone?: string | null;
  memberNumber: string;
};

type FeeDetail = {
  id: string;
  amountCents: number;
  currency?: "EUR";
  term: PaymentTerm;
  method?: PaymentMethod | null;
  status: FeeStatus;
  periodStart: string;
  periodEnd: string;
  paidAt?: string | null;
  sepaBatchRef?: string | null;
  tenantName: string;
  member: MemberMini;
};

type FeeDetailDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fee: FeeDetail;
  canManage?: boolean;
  onMarkPaid?: (feeId: string) => Promise<void> | void;
  onGenerateSepa?: (feeId: string) => Promise<void> | void;
  onDelete?: (feeId: string) => Promise<void> | void;
  onActionSuccess?: (msg: string) => void;
  onActionError?: (msg: string) => void;
};

// Helper functions
const formatEUR = (amountCents: number): string => {
  const euros = amountCents / 100;
  return new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(euros);
};

const formatDateBE = (iso: string): string => {
  const date = new Date(iso);
  const belgianDate = toZonedTime(date, 'Europe/Brussels');
  return format(belgianDate, 'dd-MM-yyyy', { locale: nl });
};

const expiryDate = (isoEnd: string): string => {
  const endDate = new Date(isoEnd);
  const belgianEndDate = toZonedTime(endDate, 'Europe/Brussels');
  const expiry = addDays(belgianEndDate, 1);
  return format(expiry, 'dd-MM-yyyy', { locale: nl });
};

const statusLabel = (status: FeeStatus): string => {
  switch (status) {
    case "OPENSTAAND": return "Openstaand";
    case "BETAALD": return "Betaald";
    case "VERVALLEN": return "Vervallen";
    default: return status;
  }
};

const getStatusBadgeVariant = (status: FeeStatus) => {
  switch (status) {
    case "OPENSTAAND": return "bg-amber-100 text-amber-800 border-amber-300";
    case "BETAALD": return "bg-green-100 text-green-800 border-green-300";
    case "VERVALLEN": return "bg-red-100 text-red-800 border-red-300";
    default: return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

const getPaymentMethodLabel = (method?: PaymentMethod | null): string => {
  if (!method) return "Niet gespecificeerd";
  switch (method) {
    case "SEPA": return "SEPA";
    case "OVERSCHRIJVING": return "Overschrijving";
    case "BANCONTACT": return "Bancontact";
    case "CASH": return "Contant";
    case "UNKNOWN": return "Onbekend";
    default: return method;
  }
};

const getTermLabel = (term: PaymentTerm): string => {
  switch (term) {
    case "MONTHLY": return "Maandelijks";
    case "YEARLY": return "Jaarlijks";
    default: return term;
  }
};

const getCategoryLabel = (category: string): string => {
  switch (category) {
    case "STUDENT": return "Student";
    case "STANDAARD": return "Standaard";
    case "SENIOR": return "Senior";
    default: return category;
  }
};

export function FeeDetailDialog({
  open,
  onOpenChange,
  fee,
  canManage = false,
  onMarkPaid,
  onGenerateSepa,
  onDelete,
  onActionSuccess,
  onActionError
}: FeeDetailDialogProps) {

  const handleMarkPaid = async () => {
    if (!onMarkPaid) return;
    try {
      await onMarkPaid(fee.id);
      onActionSuccess?.("Lidgeld succesvol gemarkeerd als betaald");
      onOpenChange(false);
    } catch (error) {
      onActionError?.("Fout bij markeren als betaald");
    }
  };

  const handleGenerateSepa = async () => {
    if (!onGenerateSepa) return;
    try {
      await onGenerateSepa(fee.id);
      onActionSuccess?.("SEPA export succesvol gegenereerd");
    } catch (error) {
      onActionError?.("Fout bij genereren SEPA export");
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    try {
      await onDelete(fee.id);
      onActionSuccess?.("Lidgeld succesvol verwijderd");
      onOpenChange(false);
    } catch (error) {
      onActionError?.("Fout bij verwijderen lidgeld");
    }
  };

  const canMarkAsPaid = fee.status !== "BETAALD";
  const canGenerateSepa = fee.method === "SEPA" && 
                          (fee.status === "OPENSTAAND" || fee.status === "VERVALLEN") && 
                          !fee.sepaBatchRef;

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <Euro className="h-5 w-5" />
                  Lidgeld Detail
                </DialogTitle>
                <DialogDescription>
                  #{fee.member.memberNumber} – {fee.member.firstName} {fee.member.lastName}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-8">
            <div className="space-y-6">
              {/* Header Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {fee.member.firstName} {fee.member.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">Lidnummer #{fee.member.memberNumber}</p>
                    </div>
                  </div>
                  <Badge className={getStatusBadgeVariant(fee.status)}>
                    {statusLabel(fee.status)}
                  </Badge>
                </div>
                <div className="text-center py-2">
                  <p className="text-2xl font-bold text-gray-900">{formatEUR(fee.amountCents)}</p>
                  <p className="text-sm text-gray-600">{formatDateBE(fee.periodStart)} – {formatDateBE(fee.periodEnd)}</p>
                </div>
              </div>

              {/* Kerninfo in 2 kolommen */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white border rounded-lg p-6 shadow-sm">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Periode & Timing
                  </h4>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm text-muted-foreground">Periode van</dt>
                      <dd className="font-medium">{formatDateBE(fee.periodStart)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Periode tot</dt>
                      <dd className="font-medium">{formatDateBE(fee.periodEnd)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground flex items-center gap-1">
                        Vervalt op
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3" />
                          </TooltipTrigger>
                          <TooltipContent>
                            De dag na de einddatum van de periode
                          </TooltipContent>
                        </Tooltip>
                      </dt>
                      <dd className="font-medium">{expiryDate(fee.periodEnd)}</dd>
                    </div>
                    {fee.paidAt && (
                      <div>
                        <dt className="text-sm text-muted-foreground">Betaald op</dt>
                        <dd className="font-medium">{formatDateBE(fee.paidAt)}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="bg-white border rounded-lg p-6 shadow-sm">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    Financiële Details
                  </h4>
                  <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <dt className="text-sm text-muted-foreground">Bedrag</dt>
                      <dd className="font-semibold text-lg">{formatEUR(fee.amountCents)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Betaaltermijn</dt>
                      <dd className="font-medium">{getTermLabel(fee.term)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Betaalmethode</dt>
                      <dd className="font-medium">{getPaymentMethodLabel(fee.method)}</dd>
                    </div>
                    {fee.sepaBatchRef && (
                      <div>
                        <dt className="text-sm text-muted-foreground">SEPA batch</dt>
                        <dd className="font-mono text-xs">{fee.sepaBatchRef}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              {/* Lid informatie */}
              <div className="bg-white border rounded-lg p-6 shadow-sm">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-purple-600" />
                  Lid informatie
                </h4>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-muted-foreground">Naam</dt>
                    <dd className="font-medium">{fee.member.firstName} {fee.member.lastName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Categorie</dt>
                    <dd className="font-medium">{getCategoryLabel(fee.member.category)}</dd>
                  </div>
                  {fee.member.email && (
                    <div>
                      <dt className="text-sm text-muted-foreground">E-mail</dt>
                      <dd>
                        <a 
                          href={`mailto:${fee.member.email}`} 
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Mail className="h-3 w-3" />
                          {fee.member.email}
                        </a>
                      </dd>
                    </div>
                  )}
                  {fee.member.phone && (
                    <div>
                      <dt className="text-sm text-muted-foreground">Telefoon</dt>
                      <dd>
                        <a 
                          href={`tel:${fee.member.phone}`} 
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Phone className="h-3 w-3" />
                          {fee.member.phone}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>

          {/* Acties */}
          {canManage && (
            <DialogFooter className="gap-3 pt-6 border-t bg-gray-50 rounded-lg p-4 mt-6">
              {canMarkAsPaid && (
                <Button onClick={handleMarkPaid} className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Markeer als betaald
                </Button>
              )}
              
              {canGenerateSepa && (
                <Button 
                  onClick={handleGenerateSepa} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Genereer SEPA-export
                </Button>
              )}
              
              <Button 
                onClick={handleDelete}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Verwijder
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}