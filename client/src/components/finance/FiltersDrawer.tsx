"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
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
  const [fromDateInput, setFromDateInput] = useState("");
  const [toDateInput, setToDateInput] = useState("");
  const [fromPopoverOpen, setFromPopoverOpen] = useState(false);
  const [toPopoverOpen, setToPopoverOpen] = useState(false);

  const updateFilter = (key: keyof FilterData, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const formatDateInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }
  };

  const parseDate = (dateString: string): Date | undefined => {
    const cleanString = dateString.replace(/\D/g, '');
    if (cleanString.length === 8) {
      const day = parseInt(cleanString.slice(0, 2));
      const month = parseInt(cleanString.slice(2, 4)) - 1;
      const year = parseInt(cleanString.slice(4, 8));
      
      const date = new Date(year, month, day);
      if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
        return date;
      }
    }
    return undefined;
  };

  const handleFromDateInput = (value: string) => {
    const formatted = formatDateInput(value);
    setFromDateInput(formatted);
    
    const parsedDate = parseDate(formatted);
    if (parsedDate) {
      updateFilter('dateFrom', parsedDate.toISOString().split('T')[0]);
    }
  };

  const handleToDateInput = (value: string) => {
    const formatted = formatDateInput(value);
    setToDateInput(formatted);
    
    const parsedDate = parseDate(formatted);
    if (parsedDate) {
      updateFilter('dateTo', parsedDate.toISOString().split('T')[0]);
    }
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
          
          <div className="relative">
            <Input
              value={fromDateInput || (filters.dateFrom ? format(new Date(filters.dateFrom), "dd/MM/yyyy", { locale: nl }) : "")}
              onChange={(e) => handleFromDateInput(e.target.value)}
              placeholder="DD/MM/YYYY"
              className="w-[160px] h-9 border-gray-200 pr-10"
              data-testid="input-date-from"
              maxLength={10}
            />
            <Popover open={fromPopoverOpen} onOpenChange={setFromPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-100"
                  onClick={() => setFromPopoverOpen(true)}
                >
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start" side="bottom">
                <Calendar
                  mode="single"
                  selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      updateFilter('dateFrom', date.toISOString().split('T')[0]);
                    } else {
                      updateFilter('dateFrom', undefined);
                    }
                    setFromDateInput("");
                    setFromPopoverOpen(false);
                  }}
                  locale={nl}
                  showOutsideDays={false}
                  className="p-3"
                  defaultMonth={new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <span className="text-sm text-gray-400">tot</span>
          
          <div className="relative">
            <Input
              value={toDateInput || (filters.dateTo ? format(new Date(filters.dateTo), "dd/MM/yyyy", { locale: nl }) : "")}
              onChange={(e) => handleToDateInput(e.target.value)}
              placeholder="DD/MM/YYYY"
              className="w-[160px] h-9 border-gray-200 pr-10"
              data-testid="input-date-to"
              maxLength={10}
            />
            <Popover open={toPopoverOpen} onOpenChange={setToPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-100"
                  onClick={() => setToPopoverOpen(true)}
                >
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start" side="bottom">
                <Calendar
                  mode="single"
                  selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      updateFilter('dateTo', date.toISOString().split('T')[0]);
                    } else {
                      updateFilter('dateTo', undefined);
                    }
                    setToDateInput("");
                    setToPopoverOpen(false);
                  }}
                  locale={nl}
                  disabled={(date) => filters.dateFrom ? date < new Date(filters.dateFrom) : false}
                  showOutsideDays={false}
                  className="p-3"
                  defaultMonth={new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
}