"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { categories, mockMembers } from "@/lib/mock/transactions";
import { FilterData } from "@/lib/zod/transaction";

interface FiltersDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: FilterData;
  onFiltersChange: (filters: FilterData) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

export function FiltersDrawer({
  open,
  onClose,
  filters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters
}: FiltersDrawerProps) {
  const updateFilter = (key: keyof FilterData, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const allCategories = [...categories.INCOME, ...categories.EXPENSE].sort();

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Geavanceerde Filters</SheetTitle>
          <SheetDescription>
            Verfijn je zoekresultaten met specifieke criteria
          </SheetDescription>
        </SheetHeader>
        
        <div className="grid gap-6 py-6">
          {/* Category Filter */}
          <div className="grid gap-2">
            <Label htmlFor="category">Categorie</Label>
            <Select value={filters.category || ""} onValueChange={(value) => updateFilter('category', value || undefined)}>
              <SelectTrigger data-testid="select-category-filter">
                <SelectValue placeholder="Selecteer categorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle categorieën</SelectItem>
                {allCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Method Filter */}
          <div className="grid gap-2">
            <Label htmlFor="method">Betaalmethode</Label>
            <Select value={filters.method || "ALL"} onValueChange={(value) => updateFilter('method', value)}>
              <SelectTrigger data-testid="select-method-filter">
                <SelectValue placeholder="Selecteer methode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Alle methodes</SelectItem>
                <SelectItem value="SEPA">SEPA</SelectItem>
                <SelectItem value="OVERSCHRIJVING">Overschrijving</SelectItem>
                <SelectItem value="BANCONTACT">Bancontact</SelectItem>
                <SelectItem value="CASH">Contant</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Member Filter */}
          <div className="grid gap-2">
            <Label htmlFor="member">Lid</Label>
            <Select value={filters.memberId || ""} onValueChange={(value) => updateFilter('memberId', value || undefined)}>
              <SelectTrigger data-testid="select-member-filter">
                <SelectValue placeholder="Selecteer lid" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle leden</SelectItem>
                {mockMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="dateFrom">Van datum</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom || ""}
                onChange={(e) => updateFilter('dateFrom', e.target.value || undefined)}
                data-testid="input-date-from"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dateTo">Tot datum</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo || ""}
                onChange={(e) => updateFilter('dateTo', e.target.value || undefined)}
                data-testid="input-date-to"
              />
            </div>
          </div>
          
          {/* Amount Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="amountMin">Min. bedrag (€)</Label>
              <Input
                id="amountMin"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={filters.amountMin || ""}
                onChange={(e) => updateFilter('amountMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                data-testid="input-amount-min"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amountMax">Max. bedrag (€)</Label>
              <Input
                id="amountMax"
                type="number"
                step="0.01"
                min="0"
                placeholder="1000,00"
                value={filters.amountMax || ""}
                onChange={(e) => updateFilter('amountMax', e.target.value ? parseFloat(e.target.value) : undefined)}
                data-testid="input-amount-max"
              />
            </div>
          </div>
        </div>
        
        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={onClearFilters} data-testid="button-clear-filters">
            Wis filters
          </Button>
          <Button onClick={() => { onApplyFilters(); onClose(); }} data-testid="button-apply-filters">
            Toepassen
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}