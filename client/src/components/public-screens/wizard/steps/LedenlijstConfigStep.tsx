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
      year: number;
      categories: string[];
    };
  };
  onUpdate: (data: any) => void;
}

const availableCategories = [
  "Volwassene",
  "Student", 
  "Kind",
  "Senior",
  "Gezin"
];

export function LedenlijstConfigStep({ data, onUpdate }: LedenlijstConfigStepProps) {
  const settings = data.ledenlijstSettings || {
    useFullNames: true,
    useInitials: false,
    filterByCategories: true,
    showVotingRights: false,
    rowsPerPage: 20,
    year: new Date().getFullYear(),
    categories: ["Volwassene", "Student"]
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
                <Label htmlFor="short-names">Korte namen (bijv. Ahmed H.)</Label>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-voting-rights"
              checked={settings.showVotingRights}
              onCheckedChange={(checked) => updateSettings('showVotingRights', checked)}
              data-testid="checkbox-voting-rights"
            />
            <Label htmlFor="show-voting-rights">Stemrecht tonen</Label>
          </div>
        </div>
      </div>

      {/* Categorie filter */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h4 className="font-medium">Categorie filter</h4>
        
        <div>
          <Label>Welke categorieën wil je tonen?</Label>
          <div className="mt-2 space-y-2">
            {availableCategories.map(category => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category}`}
                  checked={settings.categories.includes(category)}
                  onCheckedChange={() => toggleCategory(category)}
                  data-testid={`checkbox-category-${category.toLowerCase()}`}
                />
                <Label htmlFor={`category-${category}`}>{category}</Label>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Selecteer de categorieën die je wilt tonen in de ledenlijst
          </p>
        </div>
      </div>


      {/* Rijen per pagina */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h4 className="font-medium">Paginering</h4>
        
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

      {/* Preview info */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Configuratie overzicht</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• Namen: {
            settings.useFullNames && !settings.useInitials ? 'Volledige namen' :
            !settings.useFullNames && settings.useInitials ? 'Alleen initialen' :
            'Korte namen'
          }</p>
          <p>• Rijen per pagina: {settings.rowsPerPage}</p>
          <p>• Jaar: {settings.year}</p>
          <p>• Categorieën: {settings.categories.join(', ') || 'Geen geselecteerd'}</p>
          {settings.showVotingRights && <p>• Stemrecht wordt getoond</p>}
        </div>
      </div>
    </div>
  );
}