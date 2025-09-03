import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface FilterValues {
  categories: string[];
  statuses: string[];
  genders: string[];
  joinDateFrom: string;
  joinDateTo: string;
  paymentStatuses: string[];
  onlyActivePayments: boolean;
}

interface FiltersDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
}

const initialFilters: FilterValues = {
  categories: [],
  statuses: [],
  genders: [],
  joinDateFrom: "",
  joinDateTo: "",
  paymentStatuses: [],
  onlyActivePayments: false,
};

export function FiltersDrawer({ 
  open, 
  onOpenChange, 
  filters, 
  onFiltersChange 
}: FiltersDrawerProps) {
  const [localFilters, setLocalFilters] = useState<FilterValues>(filters);

  const updateLocalFilter = (key: keyof FilterValues, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    const newCategories = checked 
      ? [...localFilters.categories, category]
      : localFilters.categories.filter(c => c !== category);
    updateLocalFilter('categories', newCategories);
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    const newStatuses = checked
      ? [...localFilters.statuses, status]
      : localFilters.statuses.filter(s => s !== status);
    updateLocalFilter('statuses', newStatuses);
  };

  const handleGenderChange = (gender: string, checked: boolean) => {
    const newGenders = checked
      ? [...localFilters.genders, gender]
      : localFilters.genders.filter(g => g !== gender);
    updateLocalFilter('genders', newGenders);
  };

  const handlePaymentStatusChange = (status: string, checked: boolean) => {
    const newPaymentStatuses = checked
      ? [...localFilters.paymentStatuses, status]
      : localFilters.paymentStatuses.filter(s => s !== status);
    updateLocalFilter('paymentStatuses', newPaymentStatuses);
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onOpenChange(false);
  };

  const handleReset = () => {
    setLocalFilters(initialFilters);
    onFiltersChange(initialFilters);
    onOpenChange(false);
  };

  const hasActiveFilters = Object.values(localFilters).some(value => 
    Array.isArray(value) ? value.length > 0 : value !== "" && value !== false
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Meer filters</SheetTitle>
          <SheetDescription>
            Verfijn je zoekopdracht met geavanceerde filteropties
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Categorie Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-900">Categorie</Label>
            <Card>
              <CardContent className="p-4 space-y-3">
                {[
                  { value: 'SENIOR', label: 'Senior' },
                  { value: 'STANDAARD', label: 'Standaard' },
                  { value: 'STUDENT', label: 'Student' },
                  { value: 'JEUGD', label: 'Jeugd' }
                ].map((category) => (
                  <div key={category.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category.value}`}
                      checked={localFilters.categories.includes(category.value)}
                      onCheckedChange={(checked) => handleCategoryChange(category.value, !!checked)}
                    />
                    <Label 
                      htmlFor={`category-${category.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {category.label}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Status Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-900">Status</Label>
            <Card>
              <CardContent className="p-4 space-y-3">
                {[
                  { value: 'ACTIEF', label: 'Actief' },
                  { value: 'INACTIEF', label: 'Inactief' }
                ].map((status) => (
                  <div key={status.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status.value}`}
                      checked={localFilters.statuses.includes(status.value)}
                      onCheckedChange={(checked) => handleStatusChange(status.value, !!checked)}
                    />
                    <Label 
                      htmlFor={`status-${status.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {status.label}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Geslacht Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-900">Geslacht</Label>
            <Card>
              <CardContent className="p-4 space-y-3">
                {[
                  { value: 'M', label: 'Man' },
                  { value: 'V', label: 'Vrouw' }
                ].map((gender) => (
                  <div key={gender.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`gender-${gender.value}`}
                      checked={localFilters.genders.includes(gender.value)}
                      onCheckedChange={(checked) => handleGenderChange(gender.value, !!checked)}
                    />
                    <Label 
                      htmlFor={`gender-${gender.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {gender.label}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Inschrijvingsdatum */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-900">Inschrijvingsdatum</Label>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div>
                  <Label htmlFor="join-date-from" className="text-xs text-gray-500">Van</Label>
                  <Input
                    id="join-date-from"
                    type="date"
                    value={localFilters.joinDateFrom}
                    onChange={(e) => updateLocalFilter('joinDateFrom', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="join-date-to" className="text-xs text-gray-500">Tot</Label>
                  <Input
                    id="join-date-to"
                    type="date"
                    value={localFilters.joinDateTo}
                    onChange={(e) => updateLocalFilter('joinDateTo', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Betaalstatus */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-900">Betaalstatus</Label>
            <Card>
              <CardContent className="p-4 space-y-3">
                {[
                  { value: 'PAID', label: 'Betaald' },
                  { value: 'OPEN', label: 'Open' },
                  { value: 'OVERDUE', label: 'Vervallen' }
                ].map((status) => (
                  <div key={status.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`payment-${status.value}`}
                      checked={localFilters.paymentStatuses.includes(status.value)}
                      onCheckedChange={(checked) => handlePaymentStatusChange(status.value, !!checked)}
                    />
                    <Label 
                      htmlFor={`payment-${status.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {status.label}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Alleen actieve mandaten */}
          <div className="space-y-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="active-payments-only"
                    checked={localFilters.onlyActivePayments}
                    onCheckedChange={(checked) => updateLocalFilter('onlyActivePayments', !!checked)}
                  />
                  <Label 
                    htmlFor="active-payments-only"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Alleen actieve mandaten
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <SheetFooter className="gap-2 pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={handleReset}
            disabled={!hasActiveFilters}
            data-testid="reset-filters"
          >
            Reset
          </Button>
          <Button 
            onClick={handleApply}
            className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
            data-testid="apply-filters"
          >
            Toepassen
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}