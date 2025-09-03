import { useState } from "react";
import { Search, CreditCard, Plus, CalendarIcon } from "lucide-react";
import { CiExport, CiImport } from "react-icons/ci";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { RiResetLeftFill } from "react-icons/ri";

interface ToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  yearFilter: string;
  onYearFilterChange: (value: string) => void;
  methodFilter: string;
  onMethodFilterChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  amountMin?: number;
  onAmountMinChange: (value: number | undefined) => void;
  amountMax?: number;
  onAmountMaxChange: (value: number | undefined) => void;
  periodFrom?: Date;
  onPeriodFromChange: (date: Date | undefined) => void;
  periodTo?: Date;
  onPeriodToChange: (date: Date | undefined) => void;
  onlyWithMandate: boolean;
  onOnlyWithMandateChange: (value: boolean) => void;
  onlyOverdue: boolean;
  onOnlyOverdueChange: (value: boolean) => void;
  onResetFilters: () => void;
  selectedCount: number;
  sepaSelectedCount: number;
  onExport: () => void;
  onImport: () => void;
  onGenerateSepa: () => void;
  onBulkMarkPaid: () => void;
  newButton?: React.ReactNode;
}

export function Toolbar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  yearFilter,
  onYearFilterChange,
  methodFilter,
  onMethodFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  amountMin,
  onAmountMinChange,
  amountMax,
  onAmountMaxChange,
  periodFrom,
  onPeriodFromChange,
  periodTo,
  onPeriodToChange,
  onlyWithMandate,
  onOnlyWithMandateChange,
  onlyOverdue,
  onOnlyOverdueChange,
  onResetFilters,
  selectedCount,
  sepaSelectedCount,
  onExport,
  onImport,
  onGenerateSepa,
  onBulkMarkPaid,
  newButton,
}: ToolbarProps) {
  const [fromDateInput, setFromDateInput] = useState("");
  const [toDateInput, setToDateInput] = useState("");
  const [fromPopoverOpen, setFromPopoverOpen] = useState(false);
  const [toPopoverOpen, setToPopoverOpen] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const formatDateInput = (value: string) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');
    
    // Apply DD/MM/YYYY formatting
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
      const month = parseInt(cleanString.slice(2, 4)) - 1; // Month is 0-indexed
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
      onPeriodFromChange(parsedDate);
    }
  };

  const handleToDateInput = (value: string) => {
    const formatted = formatDateInput(value);
    setToDateInput(formatted);
    
    const parsedDate = parseDate(formatted);
    if (parsedDate) {
      onPeriodToChange(parsedDate);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Search and Action Buttons */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Zoek op lidnummer, naam of periode..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                data-testid="search-fees"
              />
            </div>
            
            <div className="flex gap-2 lg:flex-shrink-0">
              <Button 
                variant="outline" 
                onClick={onExport}
                className="h-10 px-4 border-gray-200 hover:border-gray-300"
                data-testid="export-button"
              >
                <CiExport className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                variant="outline" 
                onClick={onImport}
                className="h-10 px-4 border-gray-200 hover:border-gray-300"
                data-testid="import-button"
              >
                <CiImport className="h-4 w-4 mr-2" />
                Import
              </Button>
              {newButton && newButton}
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
                  <SelectItem value="OPEN">Openstaand</SelectItem>
                  <SelectItem value="PAID">Betaald</SelectItem>
                  <SelectItem value="OVERDUE">Achterstallig</SelectItem>
                </SelectContent>
              </Select>

              <Select value={yearFilter} onValueChange={onYearFilterChange}>
                <SelectTrigger className="w-[120px] h-9 border-gray-200" data-testid="year-filter">
                  <SelectValue placeholder="Alle jaren" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle jaren</SelectItem>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={methodFilter} onValueChange={onMethodFilterChange}>
                <SelectTrigger className="w-[170px] h-9 border-gray-200" data-testid="method-filter">
                  <SelectValue placeholder="Alle methodes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle methodes</SelectItem>
                  <SelectItem value="SEPA">SEPA</SelectItem>
                  <SelectItem value="OVERSCHRIJVING">Overschrijving</SelectItem>
                  <SelectItem value="BANCONTACT">Bancontact</SelectItem>
                  <SelectItem value="CASH">Contant</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
                <SelectTrigger className="w-[170px] h-9 border-gray-200" data-testid="category-filter">
                  <SelectValue placeholder="Alle categorieën" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle categorieën</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="STANDAARD">Standaard</SelectItem>
                  <SelectItem value="SENIOR">Senior</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Second row of filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Bedrag:</span>
                <Input
                  type="number"
                  placeholder="Min €"
                  value={amountMin || ""}
                  onChange={(e) => onAmountMinChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-[100px] h-9 border-gray-200"
                  data-testid="amount-min"
                />
                <span className="text-sm text-gray-400">tot</span>
                <Input
                  type="number"
                  placeholder="Max €"
                  value={amountMax || ""}
                  onChange={(e) => onAmountMaxChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-[100px] h-9 border-gray-200"
                  data-testid="amount-max"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Periode:</span>
                
                <div className="relative">
                  <Input
                    value={fromDateInput || (periodFrom ? format(periodFrom, "dd/MM/yyyy", { locale: nl }) : "")}
                    onChange={(e) => handleFromDateInput(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="w-[160px] h-9 border-gray-200 pr-10"
                    data-testid="paid-date-from"
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
                      <div className="p-3 border-b">
                        <div className="flex items-center justify-between space-x-2">
                          <Select
                            value={periodFrom ? periodFrom.getMonth().toString() : ""}
                            onValueChange={(month) => {
                              const currentDate = periodFrom || new Date();
                              const newDate = new Date(currentDate.getFullYear(), parseInt(month), currentDate.getDate());
                              onPeriodFromChange(newDate);
                              setFromDateInput("");
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
                            value={periodFrom ? periodFrom.getFullYear().toString() : ""}
                            onValueChange={(year) => {
                              const currentDate = periodFrom || new Date();
                              const newDate = new Date(parseInt(year), currentDate.getMonth(), currentDate.getDate());
                              onPeriodFromChange(newDate);
                              setFromDateInput("");
                            }}
                          >
                            <SelectTrigger className="w-[80px] h-8">
                              <SelectValue placeholder="Jaar" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 10 }, (_, i) => {
                                const year = new Date().getFullYear() - i;
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
                        selected={periodFrom}
                        onSelect={(date) => {
                          console.log('Calendar from date selected:', date);
                          onPeriodFromChange(date);
                          setFromDateInput("");
                          setFromPopoverOpen(false);
                        }}
                        locale={nl}
                        month={periodFrom || new Date()}
                        onMonthChange={(month) => onPeriodFromChange(month)}
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
                    value={toDateInput || (periodTo ? format(periodTo, "dd/MM/yyyy", { locale: nl }) : "")}
                    onChange={(e) => handleToDateInput(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="w-[160px] h-9 border-gray-200 pr-10"
                    data-testid="paid-date-to"
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
                      <div className="p-3 border-b">
                        <div className="flex items-center justify-between space-x-2">
                          <Select
                            value={periodTo ? periodTo.getMonth().toString() : ""}
                            onValueChange={(month) => {
                              const currentDate = periodTo || new Date();
                              const newDate = new Date(currentDate.getFullYear(), parseInt(month), currentDate.getDate());
                              onPeriodToChange(newDate);
                              setToDateInput("");
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
                            value={periodTo ? periodTo.getFullYear().toString() : ""}
                            onValueChange={(year) => {
                              const currentDate = periodTo || new Date();
                              const newDate = new Date(parseInt(year), currentDate.getMonth(), currentDate.getDate());
                              onPeriodToChange(newDate);
                              setToDateInput("");
                            }}
                          >
                            <SelectTrigger className="w-[80px] h-8">
                              <SelectValue placeholder="Jaar" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 10 }, (_, i) => {
                                const year = new Date().getFullYear() - i;
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
                        selected={periodTo}
                        onSelect={(date) => {
                          onPeriodToChange(date);
                          setToDateInput("");
                          setToPopoverOpen(false);
                        }}
                        locale={nl}
                        month={periodTo || new Date()}
                        onMonthChange={(month) => onPeriodToChange(month)}
                        disabled={(date) => periodFrom ? date < periodFrom : false}
                        showOutsideDays={false}
                        className="p-3"
                        defaultMonth={new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>


              <Button 
                variant="outline" 
                size="sm"
                onClick={onResetFilters}
                className="h-9 px-3 border-gray-200 hover:border-gray-300"
                data-testid="reset-filters-button"
              >
                <RiResetLeftFill className="h-4 w-4 mr-2" />
                Reset filters
              </Button>
            </div>

            {/* Bulk Actions */}
            {selectedCount > 0 && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm text-blue-700 font-medium">
                  {selectedCount} geselecteerd
                </span>
                <div className="flex gap-2">
                  <Button 
                    onClick={onBulkMarkPaid}
                    size="sm"
                    className="h-8"
                    data-testid="bulk-mark-paid"
                  >
                    Markeer betaald
                  </Button>
                  {sepaSelectedCount > 0 && (
                    <Button 
                      onClick={onGenerateSepa}
                      size="sm"
                      variant="outline"
                      className="h-8 flex items-center gap-1.5"
                      data-testid="generate-sepa"
                    >
                      <CreditCard className="h-3 w-3" />
                      Genereer SEPA ({sepaSelectedCount})
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}