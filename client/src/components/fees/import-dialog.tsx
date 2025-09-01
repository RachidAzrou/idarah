import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Download, Check, X, AlertTriangle } from "lucide-react";
import { formatCurrencyBE, formatDateBE } from "@/lib/format";
import { parseCsv, parseMt940, guessMatches } from "@/lib/mock/fees";
import { Fee } from "@shared/fees-schema";

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  fees: Fee[];
  onImport: (matches: any[]) => void;
}

export function ImportDialog({ open, onClose, fees, onImport }: ImportDialogProps) {
  const [step, setStep] = useState<"upload" | "preview" | "confirm">("upload");
  const [fileType, setFileType] = useState<"CSV" | "MT940" | "CODA">("CSV");
  const [file, setFile] = useState<File | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setLoading(true);

    try {
      const content = await uploadedFile.text();
      let parsedTransactions: any[] = [];

      if (fileType === "CSV") {
        parsedTransactions = parseCsv(content);
      } else if (fileType === "MT940") {
        parsedTransactions = parseMt940(content);
      } else {
        // CODA - would need specific implementation
        parsedTransactions = parseCsv(content); // Fallback to CSV for demo
      }

      setTransactions(parsedTransactions);
      
      // Auto-match transactions with fees
      const guessedMatches = guessMatches(parsedTransactions, fees);
      setMatches(guessedMatches);
      
      setStep("preview");
    } catch (error) {
      console.error("Error parsing file:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = () => {
    const confirmedMatches = matches.filter(m => m.match && m.confidence !== "unknown");
    onImport(confirmedMatches);
    handleClose();
  };

  const handleClose = () => {
    setStep("upload");
    setFile(null);
    setTransactions([]);
    setMatches([]);
    onClose();
  };

  const updateMatch = (index: number, feeId: string | null) => {
    const newMatches = [...matches];
    if (feeId) {
      const fee = fees.find(f => f.id === feeId);
      newMatches[index] = {
        ...newMatches[index],
        match: fee,
        confidence: "manual"
      };
    } else {
      newMatches[index] = {
        ...newMatches[index],
        match: null,
        confidence: "unknown"
      };
    }
    setMatches(newMatches);
  };

  const getConfidenceBadge = (confidence: string) => {
    const variants = {
      certain: "bg-green-100 text-green-800",
      possible: "bg-yellow-100 text-yellow-800",
      manual: "bg-blue-100 text-blue-800",
      unknown: "bg-gray-100 text-gray-800",
    };

    const labels = {
      certain: "Zeker",
      possible: "Mogelijk",
      manual: "Handmatig",
      unknown: "Onbekend",
    };

    return (
      <Badge className={variants[confidence as keyof typeof variants]}>
        {labels[confidence as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Betalingen importeren</DialogTitle>
          <DialogDescription>
            Import betalingen uit bankbestanden en koppel ze automatisch aan openstaande lidgelden
          </DialogDescription>
        </DialogHeader>

        <Tabs value={step} className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" disabled={step !== "upload"}>
              1. Upload bestand
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={step !== "preview"}>
              2. Controleer matches
            </TabsTrigger>
            <TabsTrigger value="confirm" disabled={step !== "confirm"}>
              3. Bevestig import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Bestandstype</Label>
                <Select value={fileType} onValueChange={(value: any) => setFileType(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CSV">CSV</SelectItem>
                    <SelectItem value="MT940">MT940 (SWIFT)</SelectItem>
                    <SelectItem value="CODA">CODA (België)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Sleep een bestand hierheen</p>
                  <p className="text-gray-600">of klik om een bestand te selecteren</p>
                  <Input
                    type="file"
                    accept=".csv,.txt,.mt940,.cod"
                    onChange={(e) => {
                      const uploadedFile = e.target.files?.[0];
                      if (uploadedFile) {
                        handleFileUpload(uploadedFile);
                      }
                    }}
                    className="hidden"
                    id="file-upload"
                  />
                  <Label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700"
                  >
                    Bestand selecteren
                  </Label>
                </div>
              </div>

              {loading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Bestand wordt verwerkt...</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Gevonden transacties</h3>
                <p className="text-gray-600">
                  {matches.filter(m => m.match).length} van {matches.length} transacties gekoppeld
                </p>
              </div>
              <Button onClick={() => setStep("confirm")}>
                Volgende stap
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Bedrag</TableHead>
                    <TableHead>Beschrijving</TableHead>
                    <TableHead>Gekoppeld aan</TableHead>
                    <TableHead>Betrouwbaarheid</TableHead>
                    <TableHead>Actie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((match, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {formatDateBE(match.transaction.date)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrencyBE(match.transaction.amount)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {match.transaction.description}
                      </TableCell>
                      <TableCell>
                        {match.match ? (
                          <div>
                            <p className="font-medium">
                              {match.match.memberFirstName} {match.match.memberLastName}
                            </p>
                            <p className="text-sm text-gray-600">
                              #{match.match.memberNumber} - {formatDateBE(match.match.periodStart)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-500">Geen koppeling</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getConfidenceBadge(match.confidence)}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={match.match?.id || ""}
                          onValueChange={(value) => updateMatch(index, value || null)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Selecteer lidgeld" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Geen koppeling</SelectItem>
                            {fees
                              .filter(fee => fee.status === "OPEN" && Math.abs(fee.amount - match.transaction.amount) < 1)
                              .map(fee => (
                                <SelectItem key={fee.id} value={fee.id}>
                                  {fee.memberFirstName} {fee.memberLastName} - {formatCurrencyBE(fee.amount)}
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="confirm" className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-800">Klaar voor import</h3>
              </div>
              <p className="mt-2 text-green-700">
                {matches.filter(m => m.match && m.confidence !== "unknown").length} betalingen worden geïmporteerd
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Betalingen die worden geïmporteerd:</h4>
              <div className="space-y-2">
                {matches
                  .filter(m => m.match && m.confidence !== "unknown")
                  .map((match, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">
                          {match.match.memberFirstName} {match.match.memberLastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          #{match.match.memberNumber} - {formatCurrencyBE(match.transaction.amount)}
                        </p>
                      </div>
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                  ))
                }
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={handleConfirmImport} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Bevestig import
              </Button>
              <Button onClick={() => setStep("preview")} variant="outline">
                Terug
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}