"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Upload, Download, Check, X, AlertTriangle } from "lucide-react";
import { CiImport, CiExport } from "react-icons/ci";

interface MemberImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (members: any[]) => void;
}

type ImportStep = 'upload' | 'mapping' | 'validation' | 'importing' | 'complete';

interface CSVRow {
  [key: string]: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

// Template met alle member velden
const MEMBER_TEMPLATE_HEADERS = [
  'Lidnummer*',
  'Voornaam*', 
  'Achternaam*',
  'Geslacht*', // M of V
  'Geboortedatum*', // DD/MM/YYYY
  'Categorie*', // STUDENT, STANDAARD, SENIOR
  'E-mail',
  'Telefoon',
  'Straat*',
  'Nummer*',
  'Postcode*',
  'Stad*',
  'Land*',
  'Betaalmethode*', // SEPA, OVERSCHRIJVING, BANCONTACT, CASH
  'IBAN',
  'Betalingsperiode*', // MONTHLY, YEARLY
  'Actief rol interesse', // JA, NEE
  'Rol beschrijving',
  'Privacy akkoord*', // JA
  'Foto/video toestemming', // JA, NEE
  'Nieuwsbrief', // JA, NEE
  'WhatsApp lijst' // JA, NEE
];

const FIELD_MAPPING = {
  'Lidnummer*': 'memberNumber',
  'Voornaam*': 'firstName',
  'Achternaam*': 'lastName', 
  'Geslacht*': 'gender',
  'Geboortedatum*': 'birthDate',
  'Categorie*': 'category',
  'E-mail': 'email',
  'Telefoon': 'phone',
  'Straat*': 'street',
  'Nummer*': 'number',
  'Postcode*': 'postalCode',
  'Stad*': 'city',
  'Land*': 'country',
  'Betaalmethode*': 'paymentMethod',
  'IBAN': 'iban',
  'Betalingsperiode*': 'paymentTerm',
  'Actief rol interesse': 'interestedInActiveRole',
  'Rol beschrijving': 'roleDescription',
  'Privacy akkoord*': 'privacyAgreement',
  'Foto/video toestemming': 'photoVideoConsent',
  'Nieuwsbrief': 'newsletterSubscription',
  'WhatsApp lijst': 'whatsappList'
};

export function MemberImportDialog({ open, onClose, onImport }: MemberImportDialogProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [validMembers, setValidMembers] = useState<any[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setStep('upload');
    setFile(null);
    setCsvData([]);
    setHeaders([]);
    setValidationErrors([]);
    setValidMembers([]);
    setImportProgress(0);
    setImportedCount(0);
    onClose();
  };

  const downloadTemplate = () => {
    const csvContent = MEMBER_TEMPLATE_HEADERS.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'leden_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const parseCSV = (content: string): { headers: string[], rows: CSVRow[] } => {
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: CSVRow = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });
    
    return { headers, rows };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.toLowerCase().endsWith('.csv')) {
      alert('Alleen CSV bestanden zijn toegestaan');
      return;
    }

    setFile(uploadedFile);
    
    try {
      const content = await uploadedFile.text();
      const { headers, rows } = parseCSV(content);
      
      setHeaders(headers);
      setCsvData(rows);
      setStep('validation');
      
      // Start validatie direct
      validateData(rows);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      alert('Fout bij het lezen van het CSV bestand');
    }
  };

  const validateData = (rows: CSVRow[]) => {
    const errors: ValidationError[] = [];
    const validMembers: any[] = [];

    rows.forEach((row, index) => {
      const member: any = {
        financialSettings: {},
        organization: {},
        permissions: {}
      };

      // Required fields validation
      const requiredFields = [
        { csvKey: 'Lidnummer*', memberKey: 'memberNumber' },
        { csvKey: 'Voornaam*', memberKey: 'firstName' },
        { csvKey: 'Achternaam*', memberKey: 'lastName' },
        { csvKey: 'Geslacht*', memberKey: 'gender' },
        { csvKey: 'Geboortedatum*', memberKey: 'birthDate' },
        { csvKey: 'Categorie*', memberKey: 'category' },
        { csvKey: 'Straat*', memberKey: 'street' },
        { csvKey: 'Nummer*', memberKey: 'number' },
        { csvKey: 'Postcode*', memberKey: 'postalCode' },
        { csvKey: 'Stad*', memberKey: 'city' },
        { csvKey: 'Land*', memberKey: 'country' },
        { csvKey: 'Betaalmethode*', memberKey: 'paymentMethod' },
        { csvKey: 'Betalingsperiode*', memberKey: 'paymentTerm' },
        { csvKey: 'Privacy akkoord*', memberKey: 'privacyAgreement' }
      ];

      requiredFields.forEach(({ csvKey, memberKey }) => {
        if (!row[csvKey] || row[csvKey].trim() === '') {
          errors.push({
            row: index + 1,
            field: csvKey,
            message: `${csvKey} is verplicht`
          });
        }
      });

      // Parse basic fields
      member.memberNumber = row['Lidnummer*'];
      member.firstName = row['Voornaam*'];
      member.lastName = row['Achternaam*'];
      
      // Gender validation
      const gender = row['Geslacht*']?.toUpperCase();
      if (gender && !['M', 'V'].includes(gender)) {
        errors.push({
          row: index + 1,
          field: 'Geslacht*',
          message: 'Geslacht moet M of V zijn'
        });
      } else {
        member.gender = gender;
      }

      // Birth date validation
      const birthDateStr = row['Geboortedatum*'];
      if (birthDateStr) {
        const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const match = birthDateStr.match(dateRegex);
        if (match) {
          const [, day, month, year] = match;
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          if (date.getDate() === parseInt(day) && date.getMonth() === parseInt(month) - 1) {
            member.birthDate = date;
          } else {
            errors.push({
              row: index + 1,
              field: 'Geboortedatum*',
              message: 'Ongeldige datum'
            });
          }
        } else {
          errors.push({
            row: index + 1,
            field: 'Geboortedatum*',
            message: 'Datum moet DD/MM/YYYY formaat hebben'
          });
        }
      }

      // Category validation
      const category = row['Categorie*']?.toUpperCase();
      if (category && !['STUDENT', 'STANDAARD', 'SENIOR'].includes(category)) {
        errors.push({
          row: index + 1,
          field: 'Categorie*',
          message: 'Categorie moet STUDENT, STANDAARD of SENIOR zijn'
        });
      } else {
        member.category = category;
      }

      // Email validation
      const email = row['E-mail'];
      if (email && email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errors.push({
            row: index + 1,
            field: 'E-mail',
            message: 'Ongeldig e-mailadres'
          });
        } else {
          member.email = email;
        }
      }

      // Address fields
      member.phone = row['Telefoon'] || '';
      member.street = row['Straat*'];
      member.number = row['Nummer*'];
      member.postalCode = row['Postcode*'];
      member.city = row['Stad*'];
      member.country = row['Land*'] || 'België';

      // Payment method validation
      const paymentMethod = row['Betaalmethode*']?.toUpperCase();
      if (paymentMethod && !['SEPA', 'OVERSCHRIJVING', 'BANCONTACT', 'CASH'].includes(paymentMethod)) {
        errors.push({
          row: index + 1,
          field: 'Betaalmethode*',
          message: 'Betaalmethode moet SEPA, OVERSCHRIJVING, BANCONTACT of CASH zijn'
        });
      } else {
        member.financialSettings.paymentMethod = paymentMethod;
      }

      // IBAN validation for non-cash payments
      const iban = row['IBAN'];
      if (paymentMethod !== 'CASH' && (!iban || iban.trim() === '')) {
        errors.push({
          row: index + 1,
          field: 'IBAN',
          message: 'IBAN is verplicht voor alle betaalmethoden behalve contant'
        });
      } else if (iban) {
        member.financialSettings.iban = iban;
      }

      // Payment term validation
      const paymentTerm = row['Betalingsperiode*']?.toUpperCase();
      if (paymentTerm && !['MONTHLY', 'YEARLY'].includes(paymentTerm)) {
        errors.push({
          row: index + 1,
          field: 'Betalingsperiode*',
          message: 'Betalingsperiode moet MONTHLY of YEARLY zijn'
        });
      } else {
        member.financialSettings.paymentTerm = paymentTerm;
      }

      // Organization fields
      const roleInterest = row['Actief rol interesse']?.toUpperCase();
      member.organization.interestedInActiveRole = roleInterest === 'JA';
      member.organization.roleDescription = row['Rol beschrijving'] || '';

      // Permissions
      const privacyAgreement = row['Privacy akkoord*']?.toUpperCase();
      if (privacyAgreement !== 'JA') {
        errors.push({
          row: index + 1,
          field: 'Privacy akkoord*',
          message: 'Privacy akkoord moet JA zijn'
        });
      } else {
        member.permissions.privacyAgreement = true;
      }

      const photoConsent = row['Foto/video toestemming']?.toUpperCase();
      member.permissions.photoVideoConsent = photoConsent === 'JA';

      const newsletter = row['Nieuwsbrief']?.toUpperCase();
      member.permissions.newsletterSubscription = newsletter === 'JA';

      const whatsapp = row['WhatsApp lijst']?.toUpperCase();
      member.permissions.whatsappList = whatsapp === 'JA';

      // Only add to valid members if no errors for this row
      const rowErrors = errors.filter(e => e.row === index + 1);
      if (rowErrors.length === 0) {
        validMembers.push(member);
      }
    });

    setValidationErrors(errors);
    setValidMembers(validMembers);
  };

  const handleImport = async () => {
    if (validMembers.length === 0) return;

    setStep('importing');
    setImportProgress(0);
    setImportedCount(0);

    try {
      for (let i = 0; i < validMembers.length; i++) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 200));
        
        setImportProgress(((i + 1) / validMembers.length) * 100);
        setImportedCount(i + 1);
      }

      // Actually import the members
      onImport(validMembers);
      
      setStep('complete');
    } catch (error) {
      console.error('Import error:', error);
      alert('Fout bij het importeren van leden');
      setStep('validation');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Leden Importeren</DialogTitle>
          <DialogDescription>
            Import leden via CSV bestand. Download eerst de template om het juiste formaat te gebruiken.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={step} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="upload" className="text-xs">Upload</TabsTrigger>
            <TabsTrigger value="mapping" className="text-xs">Mapping</TabsTrigger>
            <TabsTrigger value="validation" className="text-xs">Validatie</TabsTrigger>
            <TabsTrigger value="importing" className="text-xs">Importeren</TabsTrigger>
            <TabsTrigger value="complete" className="text-xs">Voltooid</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Download Template</Label>
                <p className="text-sm text-gray-600 mb-4">
                  Download eerst de CSV template met alle benodigde velden en voorbeelden
                </p>
                <Button onClick={downloadTemplate} variant="outline" className="gap-2">
                  <CiExport className="h-4 w-4" />
                  Download Template
                </Button>
              </div>

              <div className="border-t pt-4">
                <Label className="text-base font-medium">Upload CSV Bestand</Label>
                <p className="text-sm text-gray-600 mb-4">
                  Sleep een CSV bestand hieronder of klik om een bestand te selecteren
                </p>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <CiImport className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">Sleep een CSV bestand hierheen</p>
                    <p className="text-gray-600">of klik om een bestand te selecteren</p>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Bestand selecteren
                    </Button>
                  </div>
                </div>

                {file && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">{file.name}</span>
                      <span className="text-sm text-gray-500">
                        ({Math.round(file.size / 1024)} KB)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="validation" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Validatie Resultaat</h3>
                  <p className="text-sm text-gray-600">
                    {csvData.length} rijen gevonden, {validMembers.length} geldig, {validationErrors.length} fouten
                  </p>
                </div>
              </div>

              {validationErrors.length > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription>
                    <div className="font-medium text-red-800 mb-2">
                      {validationErrors.length} validatiefouten gevonden:
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {validationErrors.slice(0, 10).map((error, index) => (
                        <div key={index} className="text-sm text-red-700">
                          Rij {error.row}, {error.field}: {error.message}
                        </div>
                      ))}
                      {validationErrors.length > 10 && (
                        <div className="text-sm text-red-700">
                          ... en {validationErrors.length - 10} andere fouten
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {validMembers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-green-800">
                    {validMembers.length} geldige leden klaar voor import
                  </h4>
                  <div className="max-h-64 overflow-y-auto border rounded">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Lidnummer</TableHead>
                          <TableHead>Naam</TableHead>
                          <TableHead>Categorie</TableHead>
                          <TableHead>E-mail</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validMembers.slice(0, 10).map((member, index) => (
                          <TableRow key={index}>
                            <TableCell>{member.memberNumber}</TableCell>
                            <TableCell>{member.firstName} {member.lastName}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{member.category}</Badge>
                            </TableCell>
                            <TableCell>{member.email || 'Geen e-mail'}</TableCell>
                            <TableCell>
                              <Badge className="bg-green-100 text-green-800">
                                <Check className="h-3 w-3 mr-1" />
                                Geldig
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {validMembers.length > 10 && (
                      <div className="p-2 text-center text-sm text-gray-500">
                        ... en {validMembers.length - 10} andere geldige leden
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Annuleren
              </Button>
              <Button 
                onClick={handleImport}
                disabled={validMembers.length === 0}
                className="gap-2"
              >
                <CiImport className="h-4 w-4" />
                {validMembers.length} leden importeren
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="importing" className="space-y-4">
            <div className="text-center space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Leden aan het importeren...</h3>
                <p className="text-sm text-gray-600">
                  {importedCount} van {validMembers.length} leden geïmporteerd
                </p>
              </div>
              
              <div className="space-y-2">
                <Progress value={importProgress} className="w-full" />
                <p className="text-sm text-gray-500">
                  {Math.round(importProgress)}% voltooid
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="complete" className="space-y-4">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-green-800">Import Voltooid!</h3>
                <p className="text-sm text-gray-600">
                  {importedCount} leden succesvol geïmporteerd
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Sluiten
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}