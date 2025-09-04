"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Filter } from "lucide-react";
import { CiExport, CiImport } from "react-icons/ci";
import { FiltersToolbar } from "./FiltersDrawer";
import { FilterData } from "@/lib/zod/transaction";

interface ToolbarProps {
  onSearch: (search: string) => void;
  onTypeFilter: (type: string) => void;
  onPeriodFilter: (period: string) => void;
  onNewTransaction: () => void;
  onImport: () => void;
  onExport: () => void;
  onAdvancedFilters: () => void;
  searchValue: string;
  typeFilter: string;
  periodFilter: string;
  advancedFilters?: FilterData;
  onAdvancedFiltersChange?: (filters: FilterData) => void;
  onClearAdvancedFilters?: () => void;
}

export function Toolbar({
  onSearch,
  onTypeFilter,
  onPeriodFilter,
  onNewTransaction,
  onImport,
  onExport,
  onAdvancedFilters,
  searchValue,
  typeFilter,
  periodFilter,
  advancedFilters,
  onAdvancedFiltersChange,
  onClearAdvancedFilters
}: ToolbarProps) {
  return (
    <div className="glass-card card-hover animate-fade-in group p-4 rounded-lg border-0">
      <div className="space-y-4">
        {/* First Row: Search and Action Buttons */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search and Quick Filters */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-0 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Zoek op categorie, omschrijving of lidnummer..."
                value={searchValue}
                onChange={(e) => onSearch(e.target.value)}
                className="pl-10 h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                data-testid="input-search"
              />
            </div>
            
            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={onTypeFilter}>
              <SelectTrigger className="w-full sm:w-40 h-10 border-gray-200" data-testid="select-type-filter">
                <SelectValue placeholder="Alle types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Alle types</SelectItem>
                <SelectItem value="INCOME">Inkomsten</SelectItem>
                <SelectItem value="EXPENSE">Uitgaven</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 w-full lg:w-auto lg:flex-shrink-0">
            <Button
              variant="outline"
              onClick={onImport}
              className="gap-2 flex-1 lg:flex-none h-10 px-4 border-gray-200 hover:border-gray-300"
              data-testid="button-import"
            >
              <CiImport className="h-4 w-4" />
              Import
            </Button>
            <Button
              variant="outline"
              onClick={onExport}
              className="gap-2 flex-1 lg:flex-none h-10 px-4 border-gray-200 hover:border-gray-300"
              data-testid="button-export"
            >
              <CiExport className="h-4 w-4" />
              Export
            </Button>
            <Button
              onClick={onNewTransaction}
              className="gap-2 flex-1 lg:flex-none h-10 px-4"
              data-testid="button-new-transaction"
            >
              <Plus className="h-4 w-4" />
              Nieuwe transactie
            </Button>
          </div>
        </div>

        {/* Advanced Filters Toolbar */}
        {advancedFilters && onAdvancedFiltersChange && onClearAdvancedFilters && (
          <div className="pt-4 border-t border-gray-200">
            <FiltersToolbar
              filters={advancedFilters}
              onFiltersChange={onAdvancedFiltersChange}
              onClearFilters={onClearAdvancedFilters}
              typeFilter={typeFilter}
            />
          </div>
        )}
      </div>
    </div>
  );
}