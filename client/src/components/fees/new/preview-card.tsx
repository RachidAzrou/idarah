import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { membersLite } from "../../../../../lib/mock/members-lite";
import { formatDateBE, formatCurrencyBE } from "../../../../../lib/period";
import { overlaps } from "../../../../../lib/mock/fees-store";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

type PaymentMethod = 'SEPA' | 'OVERSCHRIJVING' | 'BANCONTACT' | 'CASH';

interface PreviewCardProps {
  memberId?: string;
  term?: 'MONTHLY' | 'YEARLY';
  method?: PaymentMethod;
  startDate?: Date;
  endDate?: Date;
  amount?: number;
  iban?: string;
  note?: string;
}

export function PreviewCard({
  memberId,
  term,
  method,
  startDate,
  endDate,
  amount,
  iban,
  note
}: PreviewCardProps) {
  const member = memberId ? membersLite.find(m => m.id === memberId) : null;
  
  // Calculate SEPA eligibility
  const sepaEligible = method === 'SEPA' && member?.hasMandate && iban && iban.length > 10;
  
  // Check for overlaps
  const hasOverlap = memberId && startDate && endDate ? 
    overlaps(memberId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]) : 
    false;

  // Calculate year summary for monthly payments
  const yearSummary = term === 'MONTHLY' && startDate && amount ? (() => {
    const currentYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const remainingMonths = 12 - startMonth;
    return {
      remainingMonths,
      yearTotal: amount * remainingMonths
    };
  })() : null;

  return (
    <Card className="border border-gray-200 shadow-sm h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Samenvatting
        </CardTitle>
        <p className="text-sm text-gray-600">
          Controle van het nieuwe lidgeld
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Member Info */}
        {member ? (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Lid</h4>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-medium">{member.lastName}, {member.firstName}</span>
              </p>
              <p className="text-xs text-gray-600">
                Lidnummer: #{member.memberNumber} • {member.category}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">Selecteer een lid</div>
        )}

        <Separator />

        {/* Period Info */}
        {startDate && endDate ? (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Periode</h4>
            <div className="space-y-1">
              <p className="text-sm">
                {formatDateBE(startDate)} — {formatDateBE(endDate)}
              </p>
              <p className="text-xs text-gray-600">
                Termijn: {term === 'MONTHLY' ? 'Maandelijks' : 'Jaarlijks'}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">Kies een periode</div>
        )}

        <Separator />

        {/* Payment Info */}
        {method && amount && amount > 0 ? (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Betaling</h4>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {formatCurrencyBE(amount)}
              </p>
              <p className="text-xs text-gray-600">
                Methode: {method === 'SEPA' ? 'SEPA Domiciliëring' :
                         method === 'OVERSCHRIJVING' ? 'Overschrijving' :
                         method === 'BANCONTACT' ? 'Bancontact' : 'Contant'}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">Kies een bedrag</div>
        )}

        {/* SEPA Eligibility */}
        {method === 'SEPA' && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">SEPA Geschiktheid</h4>
              <div className="flex items-center gap-2">
                {sepaEligible ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      JA
                    </Badge>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-600" />
                    <Badge className="bg-red-100 text-red-800 border-red-200">
                      NEE
                    </Badge>
                  </>
                )}
              </div>
              {!sepaEligible && (
                <div className="text-xs text-gray-600">
                  {!member?.hasMandate && "• Geen SEPA mandaat"}
                  {member?.hasMandate && (!iban || iban.length <= 10) && "• IBAN ontbreekt of ongeldig"}
                </div>
              )}
            </div>
          </>
        )}

        {/* Year Summary for Monthly */}
        {yearSummary && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Jaaroverzicht</h4>
              <div className="text-sm space-y-1">
                <p>Resterende maanden dit jaar: {yearSummary.remainingMonths}</p>
                <p className="font-medium">
                  Totaal dit jaar: {formatCurrencyBE(yearSummary.yearTotal)}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Note */}
        {note && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Notitie</h4>
              <p className="text-sm text-gray-600">{note}</p>
            </div>
          </>
        )}

        {/* Overlap Warning */}
        {hasOverlap && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 text-sm">
              <strong>Waarschuwing:</strong> Er bestaat al een lidgeld voor dit lid dat (gedeeltelijk) overlapt met de gekozen periode.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}