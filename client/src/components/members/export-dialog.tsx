import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { CiExport } from 'react-icons/ci';
import { Loader2, Check, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filteredMembers: any[];
}

interface ExportField {
  key: string;
  label: string;
  category: string;
}

const EXPORT_FIELDS: ExportField[] = [
  // Basis informatie
  { key: 'memberNumber', label: 'Lidnummer', category: 'Basis' },
  { key: 'firstName', label: 'Voornaam', category: 'Basis' },
  { key: 'lastName', label: 'Achternaam', category: 'Basis' },
  { key: 'birthDate', label: 'Geboortedatum', category: 'Basis' },
  { key: 'gender', label: 'Geslacht', category: 'Basis' },
  { key: 'nationality', label: 'Nationaliteit', category: 'Basis' },
  
  // Contact informatie
  { key: 'email', label: 'E-mail', category: 'Contact' },
  { key: 'phone', label: 'Telefoon', category: 'Contact' },
  { key: 'address', label: 'Adres', category: 'Contact' },
  { key: 'postalCode', label: 'Postcode', category: 'Contact' },
  { key: 'city', label: 'Stad', category: 'Contact' },
  { key: 'country', label: 'Land', category: 'Contact' },
  
  // Lidmaatschap
  { key: 'status', label: 'Status', category: 'Lidmaatschap' },
  { key: 'category', label: 'Categorie', category: 'Lidmaatschap' },
  { key: 'joinDate', label: 'Inschrijfdatum', category: 'Lidmaatschap' },
  { key: 'votingRights', label: 'Stemrecht', category: 'Lidmaatschap' },
  
  // Financieel
  { key: 'membershipFee', label: 'Lidmaatschapsbijdrage', category: 'Financieel' },
  { key: 'paymentMethod', label: 'Betaalmethode', category: 'Financieel' },
  { key: 'iban', label: 'IBAN', category: 'Financieel' },
  { key: 'paymentStatus', label: 'Betaalstatus', category: 'Financieel' },
  
  // Overig
  { key: 'emergencyContact', label: 'Noodcontact', category: 'Overig' },
  { key: 'emergencyPhone', label: 'Noodcontact telefoon', category: 'Overig' },
  { key: 'notes', label: 'Notities', category: 'Overig' }
];

const CATEGORIES = ['Basis', 'Contact', 'Lidmaatschap', 'Financieel', 'Overig'];

export function ExportDialog({ open, onOpenChange, filteredMembers }: ExportDialogProps) {
  const [currentStep, setCurrentStep] = useState<'selection' | 'exporting' | 'complete'>('selection');
  const [selectedFields, setSelectedFields] = useState<string[]>(['memberNumber', 'firstName', 'lastName', 'email', 'phone']);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportedFile, setExportedFile] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFieldToggle = (fieldKey: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldKey) 
        ? prev.filter(key => key !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  const handleCategoryToggle = (category: string, isChecked: boolean) => {
    const categoryFields = EXPORT_FIELDS.filter(field => field.category === category).map(field => field.key);
    
    if (isChecked) {
      setSelectedFields(prev => {
        const newFields = [...prev, ...categoryFields];
        return Array.from(new Set(newFields));
      });
    } else {
      setSelectedFields(prev => prev.filter(key => !categoryFields.includes(key)));
    }
  };

  const isCategorySelected = (category: string) => {
    const categoryFields = EXPORT_FIELDS.filter(field => field.category === category).map(field => field.key);
    return categoryFields.every(key => selectedFields.includes(key));
  };

  const isCategoryPartiallySelected = (category: string) => {
    const categoryFields = EXPORT_FIELDS.filter(field => field.category === category).map(field => field.key);
    return categoryFields.some(key => selectedFields.includes(key)) && !isCategorySelected(category);
  };

  const handleSelectAll = () => {
    setSelectedFields(EXPORT_FIELDS.map(field => field.key));
  };

  const handleSelectNone = () => {
    setSelectedFields([]);
  };

  const handleExport = async () => {
    if (selectedFields.length === 0) {
      toast({
        title: "Geen velden geselecteerd",
        description: "Selecteer minimaal één veld om te exporteren.",
        variant: "destructive"
      });
      return;
    }

    setCurrentStep('exporting');
    setExportProgress(0);

    try {
      // Simulate progress steps
      setExportProgress(25);
      
      // Get member IDs from filtered members
      const memberIds = filteredMembers.map(member => member.id);
      
      setExportProgress(50);
      
      const response = await apiRequest('POST', '/api/members/export', {
        memberIds,
        fields: selectedFields
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      setExportProgress(75);

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      const fileName = `leden_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportProgress(100);
      setExportedFile(fileName);
      setCurrentStep('complete');

      toast({
        title: "Export succesvol",
        description: `${filteredMembers.length} leden geëxporteerd naar Excel bestand.`
      });
    } catch (error) {
      console.error('Export error:', error);
      setCurrentStep('selection');
      toast({
        title: "Export mislukt",
        description: "Er is een fout opgetreden bij het exporteren van de leden.",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    setCurrentStep('selection');
    setExportProgress(0);
    setExportedFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Leden Export Wizard
          </DialogTitle>
          <p className="text-sm text-gray-600">
            {filteredMembers.length} leden klaar voor export
          </p>
        </DialogHeader>

        <Tabs value={currentStep} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="selection" disabled={currentStep === 'exporting'}>
              1. Velden Selecteren
            </TabsTrigger>
            <TabsTrigger value="exporting" disabled={currentStep !== 'exporting'}>
              2. Exporteren
            </TabsTrigger>
            <TabsTrigger value="complete" disabled={currentStep !== 'complete'}>
              3. Voltooid
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="selection" className="h-full flex flex-col space-y-4 mt-4">
              <div>
                <h3 className="text-lg font-semibold">Selecteer Export Velden</h3>
                <p className="text-sm text-gray-600">
                  Kies welke velden u wilt exporteren naar het Excel bestand.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  Alles selecteren
                </Button>
                <Button variant="outline" size="sm" onClick={handleSelectNone}>
                  Niets selecteren
                </Button>
              </div>

              <div className="flex-1 min-h-0 overflow-auto border rounded-lg p-4">
                <div className="space-y-4">
                  {CATEGORIES.map(category => {
                    const categoryFields = EXPORT_FIELDS.filter(field => field.category === category);
                    const isSelected = isCategorySelected(category);
                    const isPartiallySelected = isCategoryPartiallySelected(category);

                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${category}`}
                            checked={isSelected}
                            data-state={isPartiallySelected ? "indeterminate" : undefined}
                            onCheckedChange={(checked) => handleCategoryToggle(category, checked as boolean)}
                          />
                          <label 
                            htmlFor={`category-${category}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {category}
                          </label>
                        </div>
                        
                        <div className="ml-6 space-y-2">
                          {categoryFields.map(field => (
                            <div key={field.key} className="flex items-center space-x-2">
                              <Checkbox
                                id={field.key}
                                checked={selectedFields.includes(field.key)}
                                onCheckedChange={() => handleFieldToggle(field.key)}
                              />
                              <label 
                                htmlFor={field.key}
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {field.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>
                  Annuleren
                </Button>
                <Button 
                  onClick={handleExport}
                  disabled={selectedFields.length === 0}
                  className="gap-2"
                >
                  <CiExport className="h-4 w-4" />
                  Exporteren ({selectedFields.length} velden)
                </Button>
              </DialogFooter>
            </TabsContent>

            <TabsContent value="exporting" className="space-y-4 flex-1 flex flex-col mt-4">
              <div className="text-center space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Export wordt uitgevoerd...</h3>
                  <p className="text-sm text-gray-600">
                    {filteredMembers.length} leden met {selectedFields.length} velden worden geëxporteerd
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Progress value={exportProgress} className="w-full" />
                  <p className="text-sm text-gray-500">
                    {Math.round(exportProgress)}% voltooid
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="complete" className="space-y-4 flex-1 flex flex-col mt-4">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-green-800">Export Voltooid!</h3>
                  <p className="text-sm text-gray-600">
                    {filteredMembers.length} leden succesvol geëxporteerd
                  </p>
                  {exportedFile && (
                    <p className="text-sm text-gray-500 mt-2">
                      Bestand: {exportedFile}
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handleClose} className="w-full">
                  Sluiten
                </Button>
              </DialogFooter>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}