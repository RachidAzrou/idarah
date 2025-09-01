import { Search, Download, Upload, CreditCard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface ToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  yearFilter: string;
  onYearFilterChange: (value: string) => void;
  methodFilter: string;
  onMethodFilterChange: (value: string) => void;
  selectedCount: number;
  sepaSelectedCount: number;
  onExport: () => void;
  onImport: () => void;
  onGenerateSepa: () => void;
  onBulkMarkPaid: () => void;
  filtersDrawer?: React.ReactNode;
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
  selectedCount,
  sepaSelectedCount,
  onExport,
  onImport,
  onGenerateSepa,
  onBulkMarkPaid,
  filtersDrawer,
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
              {filtersDrawer && filtersDrawer}
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