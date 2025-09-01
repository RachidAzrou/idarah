"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "@/lib/mock/transactions";
import { formatDateBE, formatCurrencyBE } from "@/lib/format";
import { exportToCSV } from "@/lib/csv";
import { Download, FileText, FileSpreadsheet, FileImage } from "lucide-react";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  transactions: Transaction[];
}

type ExportFormat = 'csv' | 'excel' | 'pdf';

export function ExportDialog({ open, onClose, transactions }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    
    try {
      const exportData = transactions.map(t => ({
        Datum: formatDateBE(t.date),
        Type: t.type === 'INCOME' ? 'Inkomsten' : 'Uitgaven',
        Categorie: t.category,
        Lid: t.memberName || '',
        Bedrag: t.amount,
        'Bedrag (geformatteerd)': formatCurrencyBE(t.amount),
        Methode: t.method,
        Omschrijving: t.description || ''
      }));

      if (format === 'csv') {
        exportToCSV(exportData, `transacties_${new Date().toISOString().split('T')[0]}.csv`);
      } else if (format === 'excel') {
        // Mock Excel export - in real app would use a library like xlsx
        exportToCSV(exportData, `transacties_${new Date().toISOString().split('T')[0]}.xlsx`);
        alert('Excel export is een mock implementatie. In productie zou dit een echte Excel file genereren.');
      } else if (format === 'pdf') {
        // Mock PDF export - in real app would use a library like jsPDF
        alert('PDF export is een mock implementatie. In productie zou dit een echte PDF genereren.');
      }
      
      onClose();
    } catch (error) {
      alert('Fout bij het exporteren van gegevens');
    } finally {
      setLoading(false);
    }
  };

  const formatOptions = [
    {
      value: 'csv',
      label: 'CSV',
      description: 'Comma-separated values, compatible met Excel',
      icon: FileText,
      recommended: true
    },
    {
      value: 'excel',
      label: 'Excel',
      description: 'Microsoft Excel spreadsheet (.xlsx)',
      icon: FileSpreadsheet,
      recommended: false
    },
    {
      value: 'pdf',
      label: 'PDF',
      description: 'Portable Document Format voor rapporten',
      icon: FileImage,
      recommended: false
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transacties exporteren</DialogTitle>
          <DialogDescription>
            Exporteer {transactions.length} transacties naar het gewenste formaat
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          <div className="space-y-4">
            <Label className="text-base font-medium">Selecteer export formaat:</Label>
            
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as ExportFormat)}>
              {formatOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div key={option.value} className="flex items-center space-x-3">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Card className="flex-1 cursor-pointer" onClick={() => setFormat(option.value as ExportFormat)}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="h-5 w-5" />
                            <CardTitle className="text-sm">{option.label}</CardTitle>
                            {option.recommended && (
                              <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-0.5 rounded-full">
                                Aanbevolen
                              </span>
                            )}
                          </div>
                        </div>
                        <CardDescription className="text-xs">
                          {option.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Export Summary */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Export overzicht:</h4>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Aantal transacties:</span>
                <span className="font-medium">{transactions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Formaat:</span>
                <span className="font-medium">{formatOptions.find(f => f.value === format)?.label}</span>
              </div>
              <div className="flex justify-between">
                <span>Bestandsnaam:</span>
                <span className="font-medium">
                  transacties_{new Date().toISOString().split('T')[0]}.{format === 'excel' ? 'xlsx' : format}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-export">
            Annuleren
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={loading}
            className="gap-2"
            data-testid="button-start-export"
          >
            <Download className="h-4 w-4" />
            {loading ? 'Exporteren...' : 'Exporteren'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}