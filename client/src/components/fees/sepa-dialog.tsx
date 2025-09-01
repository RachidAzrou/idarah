import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Download, AlertTriangle, Check } from "lucide-react";
import { Fee } from "@shared/fees-schema";
import { formatCurrencyBE, formatDateBE } from "@/lib/format";
import { generateSepaXml } from "@/lib/mock/fees";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface SepaDialogProps {
  open: boolean;
  onClose: () => void;
  fees: Fee[];
  onGenerate: (batchRef: string, executionDate: string) => void;
}

export function SepaDialog({ open, onClose, fees, onGenerate }: SepaDialogProps) {
  const [executionDate, setExecutionDate] = useState(
    format(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), "yyyy-MM-dd") // 2 days from now
  );
  const [generating, setGenerating] = useState(false);

  // Filter fees that can be processed via SEPA
  const sepaFees = fees.filter(fee => 
    fee.method === "SEPA" && 
    fee.status === "OPEN" && 
    fee.hasMandate
  );

  const totalAmount = sepaFees.reduce((sum, fee) => sum + fee.amount, 0);
  const batchRef = `SEPA-${format(new Date(), "yyyyMMdd-HHmmss")}`;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Generate SEPA XML
      const xmlContent = generateSepaXml(sepaFees, batchRef);
      
      // Create download
      const blob = new Blob([xmlContent], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${batchRef}.xml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Update fees with batch reference
      onGenerate(batchRef, executionDate);
      onClose();
    } catch (error) {
      console.error("Error generating SEPA file:", error);
    } finally {
      setGenerating(false);
    }
  };

  const warnings = [];
  if (sepaFees.length === 0) {
    warnings.push("Geen SEPA-transacties gevonden");
  }
  const feesWithoutMandate = fees.filter(fee => 
    fee.method === "SEPA" && fee.status === "OPEN" && !fee.hasMandate
  );
  if (feesWithoutMandate.length > 0) {
    warnings.push(`${feesWithoutMandate.length} SEPA-lidgelden zonder mandaat`);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            SEPA Incasso Genereren
          </DialogTitle>
          <DialogDescription>
            Genereer een SEPA-bestand voor automatische incasso van lidgelden
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{sepaFees.length}</p>
              <p className="text-sm text-blue-800">Transacties</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{formatCurrencyBE(totalAmount)}</p>
              <p className="text-sm text-green-800">Totaal bedrag</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm font-mono text-gray-600">{batchRef}</p>
              <p className="text-sm text-gray-800">Batch referentie</p>
            </div>
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <h4 className="font-medium text-yellow-800">Waarschuwingen</h4>
              </div>
              <ul className="list-disc list-inside space-y-1 text-yellow-700">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Execution Date */}
          <div className="space-y-2">
            <Label htmlFor="executionDate">Uitvoeringsdatum</Label>
            <Input
              id="executionDate"
              type="date"
              value={executionDate}
              onChange={(e) => setExecutionDate(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd")}
              className="w-48"
            />
            <p className="text-sm text-gray-600">
              De datum waarop de incasso's worden uitgevoerd
            </p>
          </div>

          <Separator />

          {/* Transaction List */}
          <div className="space-y-4">
            <h4 className="font-medium">Te verwerken transacties ({sepaFees.length})</h4>
            
            {sepaFees.length > 0 ? (
              <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lid</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead>Bedrag</TableHead>
                      <TableHead>Mandaat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sepaFees.map((fee) => (
                      <TableRow key={fee.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {fee.memberFirstName} {fee.memberLastName}
                            </p>
                            <p className="text-sm text-gray-600">#{fee.memberNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{format(new Date(fee.periodStart), "MMM yyyy", { locale: nl })}</p>
                            <p className="text-gray-600">Vervalt: {formatDateBE(fee.dueDate)}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrencyBE(fee.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">
                            <Check className="h-3 w-3 mr-1" />
                            Actief
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Geen SEPA-transacties beschikbaar</p>
                <p className="text-sm mt-1">
                  Controleer of er openstaande lidgelden zijn met SEPA-mandaten
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleGenerate}
              disabled={sepaFees.length === 0 || generating}
              className="flex-1"
            >
              {generating ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Genereren...
                </div>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Genereer SEPA-bestand
                </>
              )}
            </Button>
            <Button onClick={onClose} variant="outline">
              Annuleren
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}