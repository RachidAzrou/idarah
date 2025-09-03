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
import { FileText, Upload, Download, Check, X, AlertTriangle, FileSpreadsheet, CheckCircle } from "lucide-react";
import { CiImport } from "react-icons/ci";
import { MdDownloading } from "react-icons/md";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { apiRequest } from '@/lib/queryClient';

interface MemberImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (members: any[]) => void;
}

type ImportStep = 'upload' | 'validation' | 'importing' | 'complete';

interface CSVRow {
  [key: string]: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

// Excel MIME types
const EXCEL_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel'
];

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
  'Stemgerechtigd', // JA, NEE
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
  'Stemgerechtigd': 'votingEligible',
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
  const [duplicateWarnings, setDuplicateWarnings] = useState<string[]>([]);
  const [duplicateCheckResults, setDuplicateCheckResults] = useState<any[]>([]);
  const [showDuplicateConfirmation, setShowDuplicateConfirmation] = useState(false);
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
    setDuplicateWarnings([]);
    setDuplicateCheckResults([]);
    setShowDuplicateConfirmation(false);
    onClose();
  };

  const downloadTemplate = (format: 'csv' | 'excel' = 'csv') => {
    if (format === 'excel') {
      downloadExcelTemplate();
    } else {
      downloadCSVTemplate();
    }
  };

  const downloadCSVTemplate = () => {
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

  const downloadSyntaxGuide = () => {
    const guideContent = `SYNTAX HANDLEIDING - LEDEN IMPORT
==================================

Deze handleiding legt uit welke waarden acceptabel zijn voor elk veld in de leden import.

VERPLICHTE VELDEN (*)
=====================

Lidnummer*
- Format: Uniek nummer
- Voorbeeld: 0001, 0002, 0003
- Moet uniek zijn

Voornaam*
- Format: Tekst
- Voorbeeld: Ahmed, Fatima, Mohamed
- Minimaal 2 karakters

Achternaam*
- Format: Tekst
- Voorbeeld: Hassan, Al-Rashid, Van den Berg
- Minimaal 2 karakters

Geslacht*
- Toegestane waarden: M, V
- M = Man, V = Vrouw
- Hoofdlettergevoelig

Geboortedatum*
- Format: DD/MM/YYYY
- Voorbeeld: 15/03/1980, 01/12/1995
- Moet geldige datum zijn

Categorie*
- Toegestane waarden: STUDENT, STANDAARD, SENIOR
- STUDENT = Voor studenten
- STANDAARD = Regulier lidmaatschap
- SENIOR = Voor senioren

Straat*
- Format: Tekst
- Voorbeeld: Kerkstraat, Avenue Louise
- Minimaal 2 karakters

Nummer*
- Format: Tekst/nummer
- Voorbeeld: 25, 12A, 100 bus 3
- Mag niet leeg zijn

Postcode*
- Format: 4 cijfers (België)
- Voorbeeld: 1000, 2000, 3000

Stad*
- Format: Tekst
- Voorbeeld: Brussel, Antwerpen, Gent
- Minimaal 2 karakters

Land*
- Format: Tekst
- Voorbeeld: België, Nederland, Frankrijk
- Minimaal 2 karakters

Betaalmethode*
- Toegestane waarden: SEPA, OVERSCHRIJVING, BANCONTACT, CASH
- SEPA = Automatische incasso (vereist IBAN)
- OVERSCHRIJVING = Handmatige bankoverschrijving
- BANCONTACT = Bancontact betaling
- CASH = Contante betaling

Betalingsperiode*
- Toegestane waarden: MONTHLY, YEARLY
- MONTHLY = Maandelijkse betaling
- YEARLY = Jaarlijkse betaling

Privacy akkoord*
- Toegestane waarden: JA
- Moet altijd JA zijn (verplicht)

OPTIONELE VELDEN
================

E-mail
- Format: geldig e-mailadres
- Voorbeeld: naam@voorbeeld.com
- Mag leeg blijven

Telefoon
- Format: telefoonnummer
- Voorbeeld: +32123456789, 0123456789
- Mag leeg blijven

IBAN
- Format: Belgisch IBAN
- Voorbeeld: BE68539007547034
- Verplicht voor SEPA en OVERSCHRIJVING betalingen
- Mag leeg voor CASH en BANCONTACT betalingen

Actief rol interesse
- Toegestane waarden: JA, NEE
- JA = Interesse in actieve rol
- NEE = Geen interesse
- Standaard: NEE

Rol beschrijving
- Format: Tekst
- Voorbeeld: Vrijwilliger evenementen
- Alleen relevant als "Actief rol interesse" = JA

Stemgerechtigd
- Toegestane waarden: JA, NEE
- JA = Lid is stemgerechtigd
- NEE = Lid is niet stemgerechtigd
- Standaard: NEE

Foto/video toestemming
- Toegestane waarden: JA, NEE
- JA = Toestemming gegeven
- NEE = Geen toestemming
- Standaard: NEE

Nieuwsbrief
- Toegestane waarden: JA, NEE
- JA = Aangemeld voor nieuwsbrief
- NEE = Niet aangemeld
- Standaard: NEE

WhatsApp lijst
- Toegestane waarden: JA, NEE
- JA = Toegevoegd aan WhatsApp lijst
- NEE = Niet toegevoegd
- Standaard: NEE

BELANGRIJKE OPMERKINGEN
=======================

1. Alle JA/NEE waarden zijn hoofdlettergevoelig
2. Datums moeten exact DD/MM/YYYY format hebben
3. Lege velden voor optionele kolommen zijn toegestaan
4. IBAN is verplicht voor SEPA betalingen
5. Lidnummers moeten uniek zijn binnen de organisatie
6. Bij duplicaten krijgt het nieuwe lid automatisch een uniek nummer

VOORBEELD RIJ
=============
001,Ahmed,Hassan,M,15/03/1980,STANDAARD,ahmed@email.com,+32123456789,Kerkstraat,25,1000,Brussel,België,SEPA,BE68539007547034,MONTHLY,NEE,,NEE,JA,JA,JA,NEE

Voor meer hulp: raadpleeg de Excel template met voorbeelden.`;

    const blob = new Blob([guideContent], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'syntax-handleiding-leden-import.txt');
  };

  const downloadExcelTemplate = () => {
    // Voorbeelddata voor Excel template
    const exampleData = [
      '001', 'Ahmed', 'Hassan', 'M', '15/03/1980', 'STANDAARD', 'ahmed@email.com', '+32123456789',
      'Kerkstraat', '25', '1000', 'Brussel', 'België', 'SEPA', 'BE68539007547034', 'MONTHLY',
      'NEE', '', 'JA', 'JA', 'JA', 'NEE'
    ];

    const workbook = XLSX.utils.book_new();
    
    // Maak werkblad met headers en voorbeelddata
    const worksheet = XLSX.utils.aoa_to_sheet([
      MEMBER_TEMPLATE_HEADERS,
      exampleData
    ]);
    
    // Voeg werkblad toe aan workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leden');
    
    // Genereer Excel bestand en download
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'leden-template.xlsx');
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

  const parseExcel = (file: File): Promise<{ headers: string[], rows: CSVRow[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Neem het eerste werkblad
          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];
          
          // Converteer naar JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
          
          if (jsonData.length === 0) {
            reject(new Error('Excel bestand is leeg'));
            return;
          }
          
          const headers = jsonData[0].map(h => String(h || '').trim());
          const rows = jsonData.slice(1).map(rowData => {
            const row: CSVRow = {};
            headers.forEach((header, index) => {
              row[header] = String(rowData[index] || '').trim();
            });
            return row;
          });
          
          resolve({ headers, rows });
        } catch (error) {
          reject(new Error('Fout bij het lezen van Excel bestand: ' + (error as Error).message));
        }
      };
      reader.onerror = () => reject(new Error('Fout bij het lezen van bestand'));
      reader.readAsArrayBuffer(file);
    });
  };

  const isExcelFile = (file: File): boolean => {
    const fileName = file.name.toLowerCase();
    return fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || 
           EXCEL_MIME_TYPES.includes(file.type);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    const isCSV = uploadedFile.name.toLowerCase().endsWith('.csv');
    const isExcel = isExcelFile(uploadedFile);

    if (!isCSV && !isExcel) {
      alert('Alleen CSV en Excel bestanden (.csv, .xlsx, .xls) zijn toegestaan');
      return;
    }

    setFile(uploadedFile);
    
    try {
      let headers: string[];
      let rows: CSVRow[];

      if (isExcel) {
        const result = await parseExcel(uploadedFile);
        headers = result.headers;
        rows = result.rows;
      } else {
        const content = await uploadedFile.text();
        const result = parseCSV(content);
        headers = result.headers;
        rows = result.rows;
      }
      
      setHeaders(headers);
      setCsvData(rows);
      setStep('validation');
      
      // Start validatie direct
      validateData(rows);
    } catch (error) {
      console.error('Error parsing file:', error);
      alert('Fout bij het lezen van het bestand: ' + (error as Error).message);
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

      // Organization/Permission fields
      const roleInterest = row['Actief rol interesse']?.toUpperCase();
      member.permissions.interestedInActiveRole = roleInterest === 'JA';
      member.permissions.roleDescription = row['Rol beschrijving'] || '';

      const votingEligible = row['Stemgerechtigd']?.toUpperCase();
      member.permissions.votingEligible = votingEligible === 'JA';

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
        // Restructure member object to match expected API format
        const structuredMember = {
          memberNumber: member.memberNumber,
          firstName: member.firstName,
          lastName: member.lastName,
          gender: member.gender,
          birthDate: member.birthDate,
          category: member.category,
          email: member.email || "",
          phone: member.phone || "",
          street: member.street,
          number: member.number,
          postalCode: member.postalCode,
          city: member.city,
          country: member.country,
          financialSettings: {
            paymentMethod: member.financialSettings.paymentMethod,
            paymentTerm: member.financialSettings.paymentTerm,
            iban: member.financialSettings.iban || "",
          },
          organization: {
            interestedInActiveRole: member.permissions.interestedInActiveRole,
            roleDescription: member.permissions.roleDescription || "",
            votingEligible: member.permissions.votingEligible || false,
          },
          permissions: {
            privacyAgreement: member.permissions.privacyAgreement,
            photoVideoConsent: member.permissions.photoVideoConsent,
            newsletterSubscription: member.permissions.newsletterSubscription,
            whatsappList: member.permissions.whatsappList,
            interestedInActiveRole: member.permissions.interestedInActiveRole,
            roleDescription: member.permissions.roleDescription || "",
          }
        };
        validMembers.push(structuredMember);
      }
    });

    setValidationErrors(errors);
    setValidMembers(validMembers);
  };

  const checkForDuplicates = async (memberData: any) => {
    try {
      const response = await apiRequest('POST', '/api/members/check-duplicates', memberData);
      return await response.json();
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return { hasDuplicates: false };
    }
  };

  const checkDuplicatesBeforeImport = async () => {
    if (validMembers.length === 0) return;

    const duplicateResults = [];
    
    // Check for duplicates for all members
    for (let i = 0; i < validMembers.length; i++) {
      const member = validMembers[i];
      const duplicateCheck = await checkForDuplicates(member);
      
      duplicateResults.push({
        member,
        duplicateCheck,
        index: i
      });
    }

    const duplicates = duplicateResults.filter(result => result.duplicateCheck.hasDuplicates);
    
    if (duplicates.length > 0) {
      setDuplicateCheckResults(duplicates);
      setShowDuplicateConfirmation(true);
      // STOP de import - gebruiker moet eerst bevestigen
      return;
    } else {
      // No duplicates, proceed with import
      proceedWithImport(validMembers);
    }
  };

  const proceedWithImport = async (membersToImport: any[]) => {
    setShowDuplicateConfirmation(false);
    setImportProgress(0);
    setImportedCount(0);

    try {
      const finalMembers = [];
      const warnings = [];
      
      // Process members and handle number duplicates
      for (const member of membersToImport) {
        const duplicateCheck = await checkForDuplicates(member);
        
        if (duplicateCheck.hasDuplicates && duplicateCheck.duplicateNumber && !duplicateCheck.duplicateNameAddress) {
          // Only number duplicate - replace with suggested number
          member.memberNumber = duplicateCheck.suggestedNumber;
          warnings.push(`Dubbel lidnummer gedetecteerd. Vervangen door uniek lidnummer: ${duplicateCheck.suggestedNumber}`);
        }
        
        finalMembers.push(member);
      }

      // Actually import the members
      onImport(finalMembers);
      setImportedCount(finalMembers.length);
      setDuplicateWarnings(warnings);
      setStep('complete');
    } catch (error) {
      console.error('Import error:', error);
      setDuplicateWarnings(['Fout bij het importeren van leden']);
    }
  };

  const handleImport = () => {
    // Start duplicaat controle wanneer gebruiker expliciet op Importeren klikt
    checkDuplicatesBeforeImport();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Leden Importeren</DialogTitle>
          <DialogDescription>Import leden via Excel bestand. Download eerst een template om het juiste formaat te gebruiken.</DialogDescription>
        </DialogHeader>

        <Tabs value={step} className="w-full flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="text-xs">Upload</TabsTrigger>
            <TabsTrigger value="validation" className="text-xs">Validatie</TabsTrigger>
            <TabsTrigger value="importing" className="text-xs">Importeren</TabsTrigger>
            <TabsTrigger value="complete" className="text-xs">Voltooid</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Download Template</Label>
                <p className="text-sm text-gray-600 mb-4">
                  Download eerst een template met alle benodigde velden en voorbeelden
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => downloadTemplate('excel')} variant="outline" className="gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel Template
                  </Button>
                  <Button onClick={() => downloadSyntaxGuide()} variant="outline" className="gap-2">
                    <MdDownloading className="h-4 w-4" />
                    Syntax Handleiding
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-base font-medium">Upload CSV of Excel Bestand</Label>
                <p className="text-sm text-gray-600 mb-4">
                  Sleep een CSV of Excel bestand hieronder of klik om een bestand te selecteren
                </p>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <CiImport className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">Sleep een Excel bestand hierheen</p>
                    <p className="text-gray-600">of klik om een bestand te selecteren</p>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
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
                  <h3 className="text-lg font-semibold">Syntax Validatie</h3>
                  <p className="text-sm text-gray-600">
                    {csvData.length} rijen gevonden, {validMembers.length} geldig, {validationErrors.length} syntax fouten
                  </p>
                </div>
              </div>

              {/* Eerste rij preview */}
              {csvData.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Voorbeeld van eerste rij data:</h4>
                  <div className="bg-gray-50 p-3 rounded border text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(csvData[0]).slice(0, 8).map(([key, value]) => (
                        <div key={key}>
                          <span className="font-medium">{key}:</span> {value || '(leeg)'}
                        </div>
                      ))}
                    </div>
                    {Object.keys(csvData[0]).length > 8 && (
                      <div className="mt-2 text-gray-500">
                        ... en {Object.keys(csvData[0]).length - 8} andere velden
                      </div>
                    )}
                  </div>
                </div>
              )}

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

              {validationErrors.length === 0 && validMembers.length > 0 && (
                <div className="space-y-2">
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Alle {validMembers.length} rijen hebben geldige syntax. Klik op 'Volgende' om door te gaan naar de import stap.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Annuleren
              </Button>
              <Button 
                onClick={() => setStep('importing')}
                disabled={validationErrors.length > 0 || validMembers.length === 0}
                className="gap-2"
              >
                Volgende: Importeren
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="importing" className="space-y-4 flex-1 flex flex-col">
            {showDuplicateConfirmation ? (
              // Show duplicate confirmation
              (<div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">
                    {duplicateCheckResults.filter(result => result.duplicateCheck.duplicateNumber).length > 0 && 
                     duplicateCheckResults.filter(result => result.duplicateCheck.duplicateNameAddress).length > 0 ? (
                      <>
                        <span className="font-medium">Duplicates gevonden:</span>
                        <br />• {duplicateCheckResults.filter(result => result.duplicateCheck.duplicateNumber).length} dubbele lidnummers
                        <br />• {duplicateCheckResults.filter(result => result.duplicateCheck.duplicateNameAddress).length} leden die al bestaan
                      </>
                    ) : duplicateCheckResults.filter(result => result.duplicateCheck.duplicateNumber).length > 0 ? (
                      <>
                        <span className="font-medium">Dubbele lidnummers gevonden:</span>
                        <br />• {duplicateCheckResults.filter(result => result.duplicateCheck.duplicateNumber).length} leden met dubbel lidnummer
                      </>
                    ) : (
                      <>
                        <span className="font-medium">Bestaande leden gevonden:</span>
                        <br />• {duplicateCheckResults.filter(result => result.duplicateCheck.duplicateNameAddress).length} leden die al bestaan
                      </>
                    )}
                  </p>
                </div>
                {/* Leden die NIET geïmporteerd worden */}
                {duplicateCheckResults.filter(result => 
                  (result.duplicateCheck.duplicateNumber && result.duplicateCheck.duplicateNameAddress) || 
                  result.duplicateCheck.duplicateNameAddress
                ).length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-800 mb-3">
                      Leden die NIET worden geïmporteerd:
                    </h4>
                    <div className="space-y-2">
                      {duplicateCheckResults
                        .filter(result => 
                          (result.duplicateCheck.duplicateNumber && result.duplicateCheck.duplicateNameAddress) || 
                          result.duplicateCheck.duplicateNameAddress
                        )
                        .map((result, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <X className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-600" />
                            <div className="text-red-800">
                              <div className="font-medium mb-1">{result.member.firstName} {result.member.lastName}</div>
                              <div className="space-y-1 text-sm">
                                {result.duplicateCheck.duplicateNumber && (
                                  <div>• Lidnummer bestaat al: {result.duplicateCheck.duplicateNumber.memberNumber} 
                                    {result.duplicateCheck.duplicateNameAddress && (
                                      <span className="text-gray-600"> (zou vervangen worden door nieuw uniek nummer)</span>
                                    )}
                                  </div>
                                )}
                                {result.duplicateCheck.duplicateNameAddress && (
                                  <div>• De persoon lijkt al te bestaan met dezelfde gegevens</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                {/* Leden met dubbel lidnummer die WEL geïmporteerd worden */}
                {duplicateCheckResults.filter(result => 
                  result.duplicateCheck.duplicateNumber && !result.duplicateCheck.duplicateNameAddress
                ).length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-medium text-amber-800 mb-3">
                      Leden met dubbel lidnummer (krijgen nieuw nummer):
                    </h4>
                    <div className="space-y-2">
                      {duplicateCheckResults
                        .filter(result => result.duplicateCheck.duplicateNumber && !result.duplicateCheck.duplicateNameAddress)
                        .map((result, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" />
                            <div className="text-amber-800">
                              <strong>{result.member.firstName} {result.member.lastName}</strong> 
                              <span className="text-amber-600"> - lidnummer {result.member.memberNumber} → {result.duplicateCheck.suggestedNumber}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDuplicateConfirmation(false)}>
                    Annuleren
                  </Button>
                  <Button 
                    onClick={() => {
                      const membersToImport = validMembers.filter(member => {
                        const result = duplicateCheckResults.find(r => r.member === member);
                        return !result || !(result.duplicateCheck.duplicateNumber && result.duplicateCheck.duplicateNameAddress) && !result.duplicateCheck.duplicateNameAddress;
                      });
                      proceedWithImport(membersToImport);
                    }}
                    disabled={validMembers.filter(member => {
                      const result = duplicateCheckResults.find(r => r.member === member);
                      return !result || !(result.duplicateCheck.duplicateNumber && result.duplicateCheck.duplicateNameAddress) && !result.duplicateCheck.duplicateNameAddress;
                    }).length === 0}
                    className="gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {validMembers.filter(member => {
                      const result = duplicateCheckResults.find(r => r.member === member);
                      return !result || !(result.duplicateCheck.duplicateNumber && result.duplicateCheck.duplicateNameAddress) && !result.duplicateCheck.duplicateNameAddress;
                    }).length === 0 ? 'Geen leden om te importeren' : 'Toch Importeren'}
                  </Button>
                </DialogFooter>
              </div>)
            ) : importProgress === 0 ? (
              // Preview before import
              (<div className="space-y-4 flex-1 flex flex-col">
                <div>
                  <h3 className="text-lg font-semibold">Import Preview</h3>
                  <p className="text-sm text-gray-600">
                    {validMembers.length} rijen klaar voor import. Controleer de gegevens en klik op 'Importeren' om door te gaan.
                  </p>
                </div>
                <div className="flex-1 overflow-auto border rounded">
                  <div className="min-w-max">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {csvData.length > 0 && Object.keys(csvData[0]).map((header) => (
                            <TableHead key={header} className="whitespace-nowrap min-w-[120px]">{header}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvData.slice(0, validMembers.length).map((row, index) => (
                          <TableRow key={index}>
                            {Object.entries(row).map(([key, value]) => (
                              <TableCell key={key} className="whitespace-nowrap min-w-[120px] text-sm">
                                {value || '-'}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                {validMembers.length !== csvData.length && (
                  <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded border">
                    Let op: {csvData.length - validMembers.length} rijen hebben validatiefouten en worden niet geïmporteerd.
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setStep('validation')}>
                    Terug
                  </Button>
                  <Button 
                    onClick={handleImport}
                    className="gap-2"
                  >
                    <CiImport className="h-4 w-4" />
                    {validMembers.length} leden importeren
                  </Button>
                </DialogFooter>
              </div>)
            ) : (
              // Progress during import
              (<div className="text-center space-y-4">
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
              </div>)
            )}
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

            {/* Duplicate warnings */}
            {duplicateWarnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-amber-800">Duplicate meldingen:</h4>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  {duplicateWarnings.map((warning, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm text-amber-800">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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