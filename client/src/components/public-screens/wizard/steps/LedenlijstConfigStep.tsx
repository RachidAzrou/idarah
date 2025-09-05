"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LedenlijstConfigStepProps {
  data: {
    ledenlijstSettings?: {
      useFullNames: boolean;
      useInitials: boolean;
      filterByCategories: boolean;
      showVotingRights: boolean;
      rowsPerPage: number;
      secondsPerPage: number;
      year: number;
      categories: string[];
    };
  };
  onUpdate: (data: any) => void;
}

const availableCategories = ['Student', 'Standaard', 'Senior', 'Stemgerechtigd', 'Mannen', 'Vrouwen'];

export function LedenlijstConfigStep({ data, onUpdate }: LedenlijstConfigStepProps) {
  const settings = data.ledenlijstSettings || {
    useFullNames: true,
    useInitials: false,
    filterByCategories: true,
    showVotingRights: false,
    rowsPerPage: 20,
    secondsPerPage: 15,
    year: new Date().getFullYear(),
    categories: ["Student", "Standaard"]
  };

  const updateSettings = (field: string, value: any) => {
    const newSettings = { ...settings, [field]: value };
    onUpdate({
      ...data,
      ledenlijstSettings: newSettings
    });
  };

  const toggleCategory = (category: string) => {
    const newCategories = settings.categories.includes(category)
      ? settings.categories.filter(c => c !== category)
      : [...settings.categories, category];
    updateSettings('categories', newCategories);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Ledenlijst configuratie</h3>
        <p className="text-sm text-gray-600">
          Stel in hoe de ledenlijst wordt weergegeven
        </p>
      </div>

      {/* Weergave opties */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h4 className="font-medium">Weergave opties</h4>
        
        <div className="space-y-4">
          <div>
            <Label>Naam weergave</Label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="full-names"
                  name="name-display"
                  checked={settings.useFullNames && !settings.useInitials}
                  onChange={() => {
                    updateSettings('useFullNames', true);
                    updateSettings('useInitials', false);
                  }}
                  data-testid="radio-full-names"
                />
                <Label htmlFor="full-names">Volledige namen (bijv. Ahmed Hassan)</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="initials-only"
                  name="name-display"
                  checked={!settings.useFullNames && settings.useInitials}
                  onChange={() => {
                    updateSettings('useFullNames', false);
                    updateSettings('useInitials', true);
                  }}
                  data-testid="radio-initials-only"
                />
                <Label htmlFor="initials-only">Alleen initialen (bijv. A.H.)</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="short-names"
                  name="name-display"
                  checked={!settings.useFullNames && !settings.useInitials}
                  onChange={() => {
                    updateSettings('useFullNames', false);
                    updateSettings('useInitials', false);
                  }}
                  data-testid="radio-short-names"
                />
                <Label htmlFor="short-names">Korte namen - alleen voornaam (bijv. Ahmed)</Label>
              </div>
            </div>
          </div>

          
        </div>
      </div>

      {/* Filter */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h4 className="font-medium">Filter</h4>
        
        <div>
          <Label>Welke categorieën wil je tonen?</Label>
          <div className="mt-2 space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="category-alle"
                checked={settings.categories.length === 6}
                onCheckedChange={() => {
                  if (settings.categories.length === 6) {
                    updateSettings('categories', []);
                  } else {
                    updateSettings('categories', ['Student', 'Standaard', 'Senior', 'Stemgerechtigd', 'Mannen', 'Vrouwen']);
                  }
                }}
                data-testid="checkbox-category-alle"
              />
              <Label htmlFor="category-alle" className="font-medium">Alle</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="category-student"
                checked={settings.categories.includes('Student')}
                onCheckedChange={() => toggleCategory('Student')}
                data-testid="checkbox-category-student"
              />
              <Label htmlFor="category-student">Student</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="category-standaard"
                checked={settings.categories.includes('Standaard')}
                onCheckedChange={() => toggleCategory('Standaard')}
                data-testid="checkbox-category-standaard"
              />
              <Label htmlFor="category-standaard">Standaard</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="category-senior"
                checked={settings.categories.includes('Senior')}
                onCheckedChange={() => toggleCategory('Senior')}
                data-testid="checkbox-category-senior"
              />
              <Label htmlFor="category-senior">Senior</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="category-stemgerechtigd"
                checked={settings.categories.includes('Stemgerechtigd')}
                onCheckedChange={() => toggleCategory('Stemgerechtigd')}
                data-testid="checkbox-category-stemgerechtigd"
              />
              <Label htmlFor="category-stemgerechtigd">Stemgerechtigd</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="category-mannen"
                checked={settings.categories.includes('Mannen')}
                onCheckedChange={() => toggleCategory('Mannen')}
                data-testid="checkbox-category-mannen"
              />
              <Label htmlFor="category-mannen">Mannen</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="category-vrouwen"
                checked={settings.categories.includes('Vrouwen')}
                onCheckedChange={() => toggleCategory('Vrouwen')}
                data-testid="checkbox-category-vrouwen"
              />
              <Label htmlFor="category-vrouwen">Vrouwen</Label>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Selecteer de categorieën die je wilt tonen in de ledenlijst
          </p>
        </div>
      </div>


      {/* Paginering */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h4 className="font-medium">Paginering</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="rows-per-page">Rijen per pagina</Label>
            <Select
              value={settings.rowsPerPage.toString()}
              onValueChange={(value) => updateSettings('rowsPerPage', parseInt(value))}
            >
              <SelectTrigger data-testid="select-rows-per-page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="seconds-per-page">Seconden per pagina</Label>
            <Select
              value={settings.secondsPerPage.toString()}
              onValueChange={(value) => updateSettings('secondsPerPage', parseInt(value))}
            >
              <SelectTrigger data-testid="select-seconds-per-page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 seconden</SelectItem>
                <SelectItem value="10">10 seconden</SelectItem>
                <SelectItem value="15">15 seconden</SelectItem>
                <SelectItem value="20">20 seconden</SelectItem>
                <SelectItem value="30">30 seconden</SelectItem>
                <SelectItem value="60">1 minuut</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Jaar */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h4 className="font-medium">Jaar</h4>
        <div>
          <Label htmlFor="year">Betaalstatus jaar</Label>
          <Input
            id="year"
            type="number"
            value={settings.year}
            onChange={(e) => updateSettings('year', parseInt(e.target.value))}
            min="2020"
            max="2030"
            data-testid="input-year"
          />
        </div>
      </div>

      
    </div>
  );
}