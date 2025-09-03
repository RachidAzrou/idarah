import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Euro, 
  CreditCard, 
  Check, 
  Download, 
  Trash2, 
  User,
  Phone,
  Mail,
  UserCircle,
  Building2
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lidgeld Details</DialogTitle>
          <DialogDescription>
            Bekijk alle details van dit lidgeld
          </DialogDescription>
        </DialogHeader>

        {/* Header Info */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-sm text-gray-600">#{fee.member.memberNumber}</span>
            <Badge className={getStatusBadgeVariant(fee.status)}>
              {statusLabel(fee.status)}
            </Badge>
          </div>
          <h3 className="font-semibold text-lg">
            {fee.member.firstName} {fee.member.lastName}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {formatEUR(fee.amountCents)} • {formatDateBE(fee.periodStart)} – {formatDateBE(fee.periodEnd)}
          </p>
        </div>

        <Tabs defaultValue="fee" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="fee" className="flex items-center gap-2">
              <Euro className="h-4 w-4" />
              <span className="hidden sm:inline">Lidgeld</span>
            </TabsTrigger>
            <TabsTrigger value="member" className="flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Lid</span>
            </TabsTrigger>
            {canManage && (
              <TabsTrigger value="actions" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Acties</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="fee" className="space-y-3">
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2 text-sm">
                <Euro className="h-4 w-4" />
                Lidgeld gegevens
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Bedrag</span>
                  <p className="font-medium text-lg">{formatEUR(fee.amountCents)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Status</span>
                  <div>
                    <Badge className={getStatusBadgeVariant(fee.status)}>
                      {statusLabel(fee.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Periode van</span>
                  <p className="font-medium">{formatDateBE(fee.periodStart)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Periode tot</span>
                  <p className="font-medium">{formatDateBE(fee.periodEnd)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Vervalt op</span>
                  <p className="font-medium">{expiryDate(fee.periodEnd)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Betaaltermijn</span>
                  <p className="font-medium">{getTermLabel(fee.term)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Betaalmethode</span>
                  <p className="font-medium">{getPaymentMethodLabel(fee.method)}</p>
                </div>
                {fee.paidAt && (
                  <div>
                    <span className="text-gray-500">Betaald op</span>
                    <p className="font-medium">{formatDateBE(fee.paidAt)}</p>
                  </div>
                )}
                {fee.sepaBatchRef && (
                  <div>
                    <span className="text-gray-500">SEPA batch</span>
                    <p className="font-mono text-xs">{fee.sepaBatchRef}</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="member" className="space-y-3">
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                Lid informatie
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Naam</span>
                  <p className="font-medium">{fee.member.firstName} {fee.member.lastName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Lidnummer</span>
                  <p className="font-medium font-mono">#{fee.member.memberNumber}</p>
                </div>
                <div>
                  <span className="text-gray-500">Categorie</span>
                  <p className="font-medium">{getCategoryLabel(fee.member.category)}</p>
                </div>
                {fee.member.email && (
                  <div>
                    <span className="text-gray-500">E-mail</span>
                    <p>
                      <a 
                        href={`mailto:${fee.member.email}`} 
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {fee.member.email}
                      </a>
                    </p>
                  </div>
                )}
                {fee.member.phone && (
                  <div>
                    <span className="text-gray-500">Telefoon</span>
                    <p>
                      <a 
                        href={`tel:${fee.member.phone}`} 
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {fee.member.phone}
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {canManage && (
            <TabsContent value="actions" className="space-y-3">
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4" />
                  Beschikbare acties
                </h4>
                <div className="space-y-3">
                  {canMarkAsPaid && (
                    <Button onClick={handleMarkPaid} className="w-full flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Markeer als betaald
                    </Button>
                  )}
                  
                  {canGenerateSepa && (
                    <Button 
                      onClick={handleGenerateSepa} 
                      variant="outline"
                      className="w-full flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Genereer SEPA-export
                    </Button>
                  )}
                  
                  <Button 
                    onClick={handleDelete}
                    variant="destructive"
                    className="w-full flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Verwijder lidgeld
                  </Button>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}