"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ImportMappingSchema, ImportMappingData } from "@/lib/zod/transaction";
import { parseCSV, parseMT940, parseCODA, CSVRow } from "@/lib/csv";
import { generateTransactionId, Transaction } from "@/lib/mock/transactions";
import { Upload, FileText, AlertTriangle, CheckCircle } from "lucide-react";

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (transactions: Transaction[]) => void;
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'complete';

export function ImportDialog({ open, onClose, onImport }: ImportDialogProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<'csv' | 'mt940' | 'coda'>('csv');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<CSVRow[]>([]);
  const [mappedTransactions, setMappedTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ImportMappingData>({
    resolver: zodResolver(ImportMappingSchema),
    defaultValues: {
      dateColumn: '',
      amountColumn: '',
      descriptionColumn: '',
      categoryColumn: ''
    }
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setFileName(file.name);
    
    try {
      const content = await file.text();
      let parseResult;

      // Determine file type and parse accordingly
      if (file.name.toLowerCase().endsWith('.csv')) {
        setFileType('csv');
        parseResult = parseCSV(content);
      } else if (file.name.toLowerCase().includes('mt940')) {
        setFileType('mt940');
        parseResult = parseMT940(content);
      } else if (file.name.toLowerCase().includes('coda')) {
        setFileType('coda');
        parseResult = parseCODA(content);
      } else {
        // Default to CSV
        setFileType('csv');
        parseResult = parseCSV(content);
      }

      if (parseResult.success) {
        setHeaders(parseResult.headers);
        setRows(parseResult.rows.slice(0, 10)); // Preview first 10 rows
        setStep('mapping');
      } else {
        alert(parseResult.error || 'Fout bij het parseren van het bestand');
      }
    } catch (error) {
      alert('Fout bij het lezen van het bestand');
    } finally {
      setLoading(false);
    }
  };

  const handleMapping = (data: ImportMappingData) => {
    setLoading(true);
    
    try {
      const transactions: Transaction[] = rows.map(row => {
        const dateStr = row[data.dateColumn];
        const amountStr = row[data.amountColumn];
        const description = data.descriptionColumn ? row[data.descriptionColumn] : '';
        const category = data.categoryColumn ? row[data.categoryColumn] : 'Onbekend';
        
        // Parse amount and determine type
        const amount = Math.abs(parseFloat(amountStr.replace(',', '.')) || 0);
        const isNegative = amountStr.includes('-') || amountStr.startsWith('D') || row.type === 'D' || row.type === 'Debet';
        const type = isNegative ? 'EXPENSE' : 'INCOME';
        
        // Parse date (try different formats)
        let date = dateStr;
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        } else if (dateStr.includes('-') && dateStr.length === 8) {
          // Format: ddmmyyyy or yyyymmdd
          if (dateStr.startsWith('20')) {
            date = `${dateStr.substr(0, 4)}-${dateStr.substr(4, 2)}-${dateStr.substr(6, 2)}`;
          } else {
            date = `20${dateStr.substr(4, 2)}-${dateStr.substr(2, 2)}-${dateStr.substr(0, 2)}`;
          }
        }

        return {
          id: generateTransactionId(),
          date,
          type,
          category,
          amount,
          method: fileType === 'csv' ? 'OVERSCHRIJVING' : 'SEPA',
          description
        } as Transaction;
      });

      setMappedTransactions(transactions);
      setStep('preview');
    } catch (error) {
      alert('Fout bij het verwerken van de gegevens');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    onImport(mappedTransactions);
    setStep('complete');
  };

  const handleClose = () => {
    setStep('upload');
    setFileName('');
    setHeaders([]);
    setRows([]);
    setMappedTransactions([]);
    form.reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          Upload bestand
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Selecteer een CSV, MT940 of CODA bestand om te importeren
        </p>
      </div>
      
      <div className="mt-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt,.mt940,.coda"
          onChange={handleFileUpload}
          className="hidden"
          data-testid="input-file-upload"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="w-full"
          disabled={loading}
          data-testid="button-select-file"
        >
          {loading ? 'Bezig met laden...' : 'Bestand selecteren'}
        </Button>
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p><strong>Ondersteunde formaten:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>CSV: Comma/semicolon separated values</li>
          <li>MT940: SWIFT bank statement format</li>
          <li>CODA: Belgian bank statement format</li>
        </ul>
      </div>
    </div>
  );

  const renderMappingStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Kolom mapping</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Koppel de kolommen uit je bestand aan de juiste velden
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleMapping)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="dateColumn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Datum kolom *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-date-column">
                        <SelectValue placeholder="Selecteer kolom" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {headers.map(header => (
                        <SelectItem key={header} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amountColumn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bedrag kolom *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-amount-column">
                        <SelectValue placeholder="Selecteer kolom" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {headers.map(header => (
                        <SelectItem key={header} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descriptionColumn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Omschrijving kolom</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-description-column">
                        <SelectValue placeholder="Selecteer kolom (optioneel)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Geen</SelectItem>
                      {headers.map(header => (
                        <SelectItem key={header} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryColumn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categorie kolom</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category-column">
                        <SelectValue placeholder="Selecteer kolom (optioneel)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Geen</SelectItem>
                      {headers.map(header => (
                        <SelectItem key={header} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Preview of first few rows */}
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-2">Voorbeeld data:</h4>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map(header => (
                      <TableHead key={header} className="text-xs">{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 3).map((row, index) => (
                    <TableRow key={index}>
                      {headers.map(header => (
                        <TableCell key={header} className="text-xs">
                          {row[header]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={() => setStep('upload')}>
              Terug
            </Button>
            <Button type="submit" disabled={loading} data-testid="button-continue-mapping">
              {loading ? 'Verwerken...' : 'Doorgaan'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Voorbeeld import</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Controleer de geïmporteerde transacties voordat je ze toevoegt
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium">
            {mappedTransactions.length} transacties gevonden in {fileName}
          </span>
        </div>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Categorie</TableHead>
              <TableHead>Bedrag</TableHead>
              <TableHead>Omschrijving</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappedTransactions.slice(0, 20).map((transaction, index) => (
              <TableRow key={index}>
                <TableCell className="text-xs">{transaction.date}</TableCell>
                <TableCell>
                  <Badge variant={transaction.type === 'INCOME' ? 'secondary' : 'destructive'}>
                    {transaction.type === 'INCOME' ? 'Inkomst' : 'Uitgave'}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{transaction.category}</TableCell>
                <TableCell className="text-xs">€{transaction.amount.toFixed(2)}</TableCell>
                <TableCell className="text-xs max-w-[200px] truncate">
                  {transaction.description || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {mappedTransactions.length > 20 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          ... en nog {mappedTransactions.length - 20} transacties
        </p>
      )}

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={() => setStep('mapping')}>
          Terug
        </Button>
        <Button onClick={handleImport} data-testid="button-confirm-import">
          Transacties importeren
        </Button>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center space-y-6">
      <div>
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">
          Import voltooid!
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {mappedTransactions.length} transacties zijn succesvol geïmporteerd
        </p>
      </div>
      
      <Button onClick={handleClose} className="w-full" data-testid="button-close-import">
        Sluiten
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transacties importeren</DialogTitle>
          <DialogDescription>
            Import transacties vanuit CSV, MT940 of CODA bestanden
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          {step === 'upload' && renderUploadStep()}
          {step === 'mapping' && renderMappingStep()}
          {step === 'preview' && renderPreviewStep()}
          {step === 'complete' && renderCompleteStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}