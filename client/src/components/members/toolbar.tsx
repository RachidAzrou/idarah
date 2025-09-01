import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Download, Upload, Plus, SlidersHorizontal, Command } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  genderFilter: string;
  onGenderFilterChange: (value: string) => void;
  joinDateFrom: string;
  onJoinDateFromChange: (value: string) => void;
  joinDateTo: string;
  onJoinDateToChange: (value: string) => void;
  paymentStatusFilter: string;
  onPaymentStatusFilterChange: (value: string) => void;
  onExport: () => void;
  onImport: () => void;
  onNewMember: () => void;
  onMoreFilters: () => void;
  className?: string;
}

export function Toolbar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  genderFilter,
  onGenderFilterChange,
  joinDateFrom,
  onJoinDateFromChange,
  joinDateTo,
  onJoinDateToChange,
  paymentStatusFilter,
  onPaymentStatusFilterChange,
  onExport,
  onImport,
  onNewMember,
  onMoreFilters,
  className
}: ToolbarProps) {
  return (
    <Card className={cn("mb-6", className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Search and Action Buttons */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Zoek op naam, e-mail of lidnummer..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-16 h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                data-testid="search-members"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1 text-xs text-gray-400">
                <Command className="h-3 w-3" />
                <span>K</span>
              </div>
            </div>
            
            <div className="flex gap-2 lg:flex-shrink-0">
              <Button 
                variant="outline" 
                onClick={onExport}
                className="h-10 px-4 border-gray-200 hover:border-gray-300"
                data-testid="export-button"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                variant="outline" 
                onClick={onImport}
                className="h-10 px-4 border-gray-200 hover:border-gray-300"
                data-testid="import-button"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button 
                onClick={onNewMember}
                className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="new-member-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nieuw lid
              </Button>
            </div>
          </div>

          {/* All Filters */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3">
              <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                <SelectTrigger className="w-[140px] h-9 border-gray-200" data-testid="status-filter">
                  <SelectValue placeholder="Alle statussen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statussen</SelectItem>
                  <SelectItem value="ACTIEF">Actief</SelectItem>
                  <SelectItem value="INACTIEF">Inactief</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
                <SelectTrigger className="w-[140px] h-9 border-gray-200" data-testid="category-filter">
                  <SelectValue placeholder="Alle categorieën" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle categorieën</SelectItem>
                  <SelectItem value="SENIOR">Senior</SelectItem>
                  <SelectItem value="VOLWASSEN">Volwassene</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="JEUGD">Jeugd</SelectItem>
                </SelectContent>
              </Select>

              <Select value={genderFilter} onValueChange={onGenderFilterChange}>
                <SelectTrigger className="w-[120px] h-9 border-gray-200" data-testid="gender-filter">
                  <SelectValue placeholder="Geslacht" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="M">Man</SelectItem>
                  <SelectItem value="V">Vrouw</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentStatusFilter} onValueChange={onPaymentStatusFilterChange}>
                <SelectTrigger className="w-[140px] h-9 border-gray-200" data-testid="payment-status-filter">
                  <SelectValue placeholder="Betaalstatus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="PAID">Betaald</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="OVERDUE">Achterstallig</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Inschrijving:</span>
                <Input
                  type="date"
                  value={joinDateFrom}
                  onChange={(e) => onJoinDateFromChange(e.target.value)}
                  className="w-[140px] h-9 border-gray-200"
                  placeholder="Van datum"
                  data-testid="join-date-from"
                />
                <span className="text-sm text-gray-400">tot</span>
                <Input
                  type="date"
                  value={joinDateTo}
                  onChange={(e) => onJoinDateToChange(e.target.value)}
                  className="w-[140px] h-9 border-gray-200"
                  placeholder="Tot datum"
                  data-testid="join-date-to"
                />
              </div>

              <Button 
                variant="outline" 
                size="sm"
                onClick={onMoreFilters}
                className="h-9 px-3 border-gray-200 hover:border-gray-300"
                data-testid="more-filters-button"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Reset filters
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}