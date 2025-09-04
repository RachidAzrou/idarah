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
    <div className="flex flex-col gap-4">
      {/* First row: Main filter selects */}
      <div className="flex flex-wrap gap-3">
        <Select value={filters.category || "ALL_CATEGORIES"} onValueChange={(value) => updateFilter('category', value === 'ALL_CATEGORIES' ? undefined : value)}>
          <SelectTrigger className="w-[170px] h-9 border-gray-200" data-testid="select-category-filter">
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
          <SelectTrigger className="w-[170px] h-9 border-gray-200" data-testid="select-method-filter">
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
          <SelectTrigger className="w-[170px] h-9 border-gray-200" data-testid="select-member-filter">
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

      {/* Second row: Amount and Date ranges with labels */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Bedrag:</span>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="Min €"
            value={filters.amountMin || ""}
            onChange={(e) => updateFilter('amountMin', e.target.value ? parseFloat(e.target.value) : undefined)}
            className="w-[100px] h-9 border-gray-200"
            data-testid="input-amount-min"
          />
          <span className="text-sm text-gray-400">tot</span>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="Max €"
            value={filters.amountMax || ""}
            onChange={(e) => updateFilter('amountMax', e.target.value ? parseFloat(e.target.value) : undefined)}
            className="w-[100px] h-9 border-gray-200"
            data-testid="input-amount-max"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Periode:</span>
          <Input
            type="date"
            value={filters.dateFrom || ""}
            onChange={(e) => updateFilter('dateFrom', e.target.value || undefined)}
            className="w-[160px] h-9 border-gray-200"
            data-testid="input-date-from"
          />
          <span className="text-sm text-gray-400">tot</span>
          <Input
            type="date"
            value={filters.dateTo || ""}
            onChange={(e) => updateFilter('dateTo', e.target.value || undefined)}
            className="w-[160px] h-9 border-gray-200"
            data-testid="input-date-to"
          />
        </div>
      </div>
    </div>
  );
}