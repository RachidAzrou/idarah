import { Search, Download, Upload, CreditCard, Plus, CalendarIcon } from "lucide-react";
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
  paidFrom?: Date;
  onPaidFromChange: (date: Date | undefined) => void;
  paidTo?: Date;
  onPaidToChange: (date: Date | undefined) => void;
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
  paidFrom,
  onPaidFromChange,
  paidTo,
  onPaidToChange,
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
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

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
                  <SelectItem value="VOLWASSEN">Volwassen</SelectItem>
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
                <span className="text-sm text-gray-600">Betaald op:</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[140px] h-9 justify-start text-left font-normal border-gray-200",
                        !paidFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {paidFrom ? format(paidFrom, "dd/MM/yyyy", { locale: nl }) : "Van datum"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={paidFrom}
                      onSelect={onPaidFromChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-sm text-gray-400">tot</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[140px] h-9 justify-start text-left font-normal border-gray-200",
                        !paidTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {paidTo ? format(paidTo, "dd/MM/yyyy", { locale: nl }) : "Tot datum"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={paidTo}
                      onSelect={onPaidToChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="onlyWithMandate"
                    checked={onlyWithMandate}
                    onCheckedChange={onOnlyWithMandateChange}
                  />
                  <Label htmlFor="onlyWithMandate" className="text-sm">
                    Alleen met SEPA-mandaat
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="onlyOverdue"
                    checked={onlyOverdue}
                    onCheckedChange={onOnlyOverdueChange}
                  />
                  <Label htmlFor="onlyOverdue" className="text-sm">
                    Alleen achterstallig
                  </Label>
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