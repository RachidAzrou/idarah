"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories, mockMembers } from "@/lib/mock/transactions";
import { FilterData } from "@/lib/zod/transaction";

interface FiltersToolbarProps {
  filters: FilterData;
  onFiltersChange: (filters: FilterData) => void;
  onClearFilters: () => void;
}

export function FiltersToolbar({
  filters,
  onFiltersChange,
  onClearFilters
}: FiltersToolbarProps) {
  const updateFilter = (key: keyof FilterData, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const allCategories = [...categories.INCOME, ...categories.EXPENSE].sort();

  const hasActiveFilters = filters.category || filters.method !== "ALL" || filters.memberId || 
                          filters.dateFrom || filters.dateTo || filters.amountMin || filters.amountMax;

  return (
    <div className="space-y-4">
      {/* First Row: Category, Method, Member */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select value={filters.category || "ALL_CATEGORIES"} onValueChange={(value) => updateFilter('category', value === 'ALL_CATEGORIES' ? undefined : value)}>
          <SelectTrigger data-testid="select-category-filter">
            <SelectValue placeholder="Alle categorieën" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL_CATEGORIES">Alle categorieën</SelectItem>
            {allCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filters.method || "ALL"} onValueChange={(value) => updateFilter('method', value)}>
          <SelectTrigger data-testid="select-method-filter">
            <SelectValue placeholder="Alle methodes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Alle methodes</SelectItem>
            <SelectItem value="SEPA">SEPA</SelectItem>
            <SelectItem value="OVERSCHRIJVING">Overschrijving</SelectItem>
            <SelectItem value="BANCONTACT">Bancontact</SelectItem>
            <SelectItem value="CASH">Contant</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filters.memberId || "ALL_MEMBERS"} onValueChange={(value) => updateFilter('memberId', value === 'ALL_MEMBERS' ? undefined : value)}>
          <SelectTrigger data-testid="select-member-filter">
            <SelectValue placeholder="Alle leden" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL_MEMBERS">Alle leden</SelectItem>
            {mockMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Second Row: Date Range and Amount Range */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Input
          type="date"
          value={filters.dateFrom || ""}
          onChange={(e) => updateFilter('dateFrom', e.target.value || undefined)}
          data-testid="input-date-from"
          placeholder="Van datum"
        />
        <Input
          type="date"
          value={filters.dateTo || ""}
          onChange={(e) => updateFilter('dateTo', e.target.value || undefined)}
          data-testid="input-date-to"
          placeholder="Tot datum"
        />
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="Min. bedrag (€)"
          value={filters.amountMin || ""}
          onChange={(e) => updateFilter('amountMin', e.target.value ? parseFloat(e.target.value) : undefined)}
          data-testid="input-amount-min"
        />
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="Max. bedrag (€)"
          value={filters.amountMax || ""}
          onChange={(e) => updateFilter('amountMax', e.target.value ? parseFloat(e.target.value) : undefined)}
          data-testid="input-amount-max"
        />
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onClearFilters} data-testid="button-clear-filters">
            Wis alle filters
          </Button>
        </div>
      )}
    </div>
  );
}