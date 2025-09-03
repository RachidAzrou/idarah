"use client";

import { PaymentMatrixConfig } from "@/lib/mock/public-screens";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

interface MatrixConfigFormProps {
  config: PaymentMatrixConfig;
  onChange: (config: PaymentMatrixConfig) => void;
}

export function MatrixConfigForm({ config, onChange }: MatrixConfigFormProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i - 2);

  const updateConfig = (updates: Partial<PaymentMatrixConfig>) => {
    onChange({ ...config, ...updates });
  };

  const updateFilters = (updates: Partial<PaymentMatrixConfig['filters']>) => {
    onChange({
      ...config,
      filters: { ...config.filters, ...updates }
    });
  };

  const updateDisplay = (updates: Partial<PaymentMatrixConfig['display']>) => {
    onChange({
      ...config,
      display: { ...config.display, ...updates }
    });
  };

  const updateColors = (updates: Partial<PaymentMatrixConfig['colors']>) => {
    onChange({
      ...config,
      colors: { ...config.colors, ...updates }
    });
  };

  const updateLayout = (updates: Partial<PaymentMatrixConfig['layout']>) => {
    onChange({
      ...config,
      layout: { ...config.layout, ...updates }
    });
  };

  const categories = ['Senior', 'Standaard', 'Student'];

  const toggleCategory = (category: string) => {
    const newCategories = config.filters.categories.includes(category)
      ? config.filters.categories.filter(c => c !== category)
      : [...config.filters.categories, category];
    updateFilters({ categories: newCategories });
  };

  return (
    <div className="space-y-6">
      {/* Basic Settings */}
      <div className="space-y-4">
        <h4 className="font-medium">Basis instellingen</h4>
        
        <div className="space-y-2">
          <Label htmlFor="matrix-year">Jaar</Label>
          <Select value={config.year.toString()} onValueChange={(value) => updateConfig({ year: parseInt(value) })}>
            <SelectTrigger id="matrix-year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Filters */}
      <div className="space-y-4">
        <h4 className="font-medium">Filters</h4>
        
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium">Categorieën</Label>
            <div className="mt-2 space-y-2">
              {categories.map(category => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category}`}
                    checked={config.filters.categories.includes(category)}
                    onCheckedChange={() => toggleCategory(category)}
                  />
                  <Label 
                    htmlFor={`category-${category}`}
                    className="text-sm font-normal"
                  >
                    {category}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Alleen actieve leden</Label>
              <div className="text-xs text-gray-500">
                Toon alleen leden die momenteel actief zijn
              </div>
            </div>
            <Switch
              checked={config.filters.activeOnly}
              onCheckedChange={(checked) => updateFilters({ activeOnly: checked })}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Display Options */}
      <div className="space-y-4">
        <h4 className="font-medium">Weergave opties</h4>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Toon grafiek</Label>
              <div className="text-xs text-gray-500">
                Donut grafiek met betaalstatistieken
              </div>
            </div>
            <Switch
              checked={config.display.showChart}
              onCheckedChange={(checked) => updateDisplay({ showChart: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Compacte labels</Label>
              <div className="text-xs text-gray-500">
                Voornaam initiaal + volledige achternaam
              </div>
            </div>
            <Switch
              checked={config.display.compactLabels}
              onCheckedChange={(checked) => updateDisplay({ compactLabels: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Toon percentage</Label>
              <div className="text-xs text-gray-500">
                Percentage betaalde bedragen in header
              </div>
            </div>
            <Switch
              checked={config.display.showPercentage}
              onCheckedChange={(checked) => updateDisplay({ showPercentage: checked })}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Colors */}
      <div className="space-y-4">
        <h4 className="font-medium">Kleuren</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="color-paid">Betaald</Label>
            <div className="flex gap-2">
              <Input
                id="color-paid"
                type="color"
                value={config.colors.paid}
                onChange={(e) => updateColors({ paid: e.target.value })}
                className="w-12 h-8 p-1 border"
              />
              <Input
                value={config.colors.paid}
                onChange={(e) => updateColors({ paid: e.target.value })}
                className="font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color-open">Openstaand</Label>
            <div className="flex gap-2">
              <Input
                id="color-open"
                type="color"
                value={config.colors.open}
                onChange={(e) => updateColors({ open: e.target.value })}
                className="w-12 h-8 p-1 border"
              />
              <Input
                value={config.colors.open}
                onChange={(e) => updateColors({ open: e.target.value })}
                className="font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color-overdue">Vervallen</Label>
            <div className="flex gap-2">
              <Input
                id="color-overdue"
                type="color"
                value={config.colors.overdue}
                onChange={(e) => updateColors({ overdue: e.target.value })}
                className="w-12 h-8 p-1 border"
              />
              <Input
                value={config.colors.overdue}
                onChange={(e) => updateColors({ overdue: e.target.value })}
                className="font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color-unknown">Onbekend</Label>
            <div className="flex gap-2">
              <Input
                id="color-unknown"
                type="color"
                value={config.colors.unknown}
                onChange={(e) => updateColors({ unknown: e.target.value })}
                className="w-12 h-8 p-1 border"
              />
              <Input
                value={config.colors.unknown}
                onChange={(e) => updateColors({ unknown: e.target.value })}
                className="font-mono text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Layout */}
      <div className="space-y-4">
        <h4 className="font-medium">Layout</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="max-row-height">Max rij hoogte (px)</Label>
            <Input
              id="max-row-height"
              type="number"
              min="32"
              max="80"
              value={config.layout.maxRowHeight}
              onChange={(e) => updateLayout({ maxRowHeight: parseInt(e.target.value) || 48 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="column-width">Kolom breedte (px)</Label>
            <Input
              id="column-width"
              type="number"
              min="32"
              max="80"
              value={config.layout.columnWidth}
              onChange={(e) => updateLayout({ columnWidth: parseInt(e.target.value) || 48 })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}