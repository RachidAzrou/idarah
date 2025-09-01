import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, Download, Upload, Plus, SlidersHorizontal, Command, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  votingRightsFilter: string;
  onVotingRightsFilterChange: (value: string) => void;
  joinDateFrom: Date | undefined;
  onJoinDateFromChange: (date: Date | undefined) => void;
  joinDateTo: Date | undefined;
  onJoinDateToChange: (date: Date | undefined) => void;
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
  votingRightsFilter,
  onVotingRightsFilterChange,
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
                <SelectTrigger className="w-[160px] h-9 border-gray-200" data-testid="status-filter">
                  <SelectValue placeholder="Alle statussen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statussen</SelectItem>
                  <SelectItem value="ACTIEF">Actief</SelectItem>
                  <SelectItem value="INACTIEF">Inactief</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
                <SelectTrigger className="w-[170px] h-9 border-gray-200" data-testid="category-filter">
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

              <Select value={votingRightsFilter} onValueChange={onVotingRightsFilterChange}>
                <SelectTrigger className="w-[180px] h-9 border-gray-200" data-testid="voting-rights-filter">
                  <SelectValue placeholder="Alle stemgerechtigden" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle stemgerechtigden</SelectItem>
                  <SelectItem value="yes">Stemgerechtigd</SelectItem>
                  <SelectItem value="no">Niet stemgerechtigd</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentStatusFilter} onValueChange={onPaymentStatusFilterChange}>
                <SelectTrigger className="w-[200px] h-9 border-gray-200" data-testid="payment-status-filter">
                  <SelectValue placeholder="Alle betaalstatussen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle betaalstatussen</SelectItem>
                  <SelectItem value="PAID">Betaald</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="OVERDUE">Achterstallig</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Inschrijving:</span>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[180px] h-9 justify-start text-left font-normal border-gray-200 cursor-pointer",
                        !joinDateFrom && "text-muted-foreground"
                      )}
                      data-testid="join-date-from"
                      type="button"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {joinDateFrom ? format(joinDateFrom, "dd/MM/yyyy", { locale: nl }) : "Van datum"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" side="bottom">
                    <div className="p-3 border-b">
                      <div className="flex items-center justify-between space-x-2">
                        <Select
                          value={joinDateFrom ? joinDateFrom.getMonth().toString() : ""}
                          onValueChange={(month) => {
                            const currentDate = joinDateFrom || new Date();
                            const newDate = new Date(currentDate.getFullYear(), parseInt(month), 1);
                            onJoinDateFromChange(newDate);
                          }}
                        >
                          <SelectTrigger className="w-[120px] h-8">
                            <SelectValue placeholder="Maand" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {format(new Date(2000, i, 1), "MMMM", { locale: nl })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={joinDateFrom ? joinDateFrom.getFullYear().toString() : ""}
                          onValueChange={(year) => {
                            const currentDate = joinDateFrom || new Date();
                            const newDate = new Date(parseInt(year), currentDate.getMonth(), 1);
                            onJoinDateFromChange(newDate);
                          }}
                        >
                          <SelectTrigger className="w-[80px] h-8">
                            <SelectValue placeholder="Jaar" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) => {
                              const year = 2000 + i;
                              return (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Calendar
                      mode="single"
                      selected={joinDateFrom}
                      onSelect={onJoinDateFromChange}
                      locale={nl}
                      month={joinDateFrom}
                      onMonthChange={(month) => onJoinDateFromChange(month)}
                      showOutsideDays={false}
                      className="p-3"
                    />
                  </PopoverContent>
                </Popover>
                
                <span className="text-sm text-gray-400">tot</span>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[180px] h-9 justify-start text-left font-normal border-gray-200 cursor-pointer",
                        !joinDateTo && "text-muted-foreground"
                      )}
                      data-testid="join-date-to"
                      type="button"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {joinDateTo ? format(joinDateTo, "dd/MM/yyyy", { locale: nl }) : "Tot datum"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" side="bottom">
                    <div className="p-3 border-b">
                      <div className="flex items-center justify-between space-x-2">
                        <Select
                          value={joinDateTo ? joinDateTo.getMonth().toString() : ""}
                          onValueChange={(month) => {
                            const currentDate = joinDateTo || new Date();
                            const newDate = new Date(currentDate.getFullYear(), parseInt(month), 1);
                            onJoinDateToChange(newDate);
                          }}
                        >
                          <SelectTrigger className="w-[120px] h-8">
                            <SelectValue placeholder="Maand" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {format(new Date(2000, i, 1), "MMMM", { locale: nl })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={joinDateTo ? joinDateTo.getFullYear().toString() : ""}
                          onValueChange={(year) => {
                            const currentDate = joinDateTo || new Date();
                            const newDate = new Date(parseInt(year), currentDate.getMonth(), 1);
                            onJoinDateToChange(newDate);
                          }}
                        >
                          <SelectTrigger className="w-[80px] h-8">
                            <SelectValue placeholder="Jaar" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) => {
                              const year = 2000 + i;
                              return (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Calendar
                      mode="single"
                      selected={joinDateTo}
                      onSelect={onJoinDateToChange}
                      locale={nl}
                      month={joinDateTo}
                      onMonthChange={(month) => onJoinDateToChange(month)}
                      disabled={(date) => joinDateFrom ? date < joinDateFrom : false}
                      showOutsideDays={false}
                      className="p-3"
                    />
                  </PopoverContent>
                </Popover>
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