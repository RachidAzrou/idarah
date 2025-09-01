import { Search, Download, Upload, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
}: ToolbarProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Zoek op lidnummer, naam of periode..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statussen</SelectItem>
              <SelectItem value="OPEN">Openstaand</SelectItem>
              <SelectItem value="PAID">Betaald</SelectItem>
              <SelectItem value="OVERDUE">Achterstallig</SelectItem>
            </SelectContent>
          </Select>

          <Select value={yearFilter} onValueChange={onYearFilterChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Jaar" />
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
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Methode" />
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
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-3">
          <Button onClick={onExport} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={onImport} variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
        </div>

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
              >
                Markeer betaald
              </Button>
              {sepaSelectedCount > 0 && (
                <Button 
                  onClick={onGenerateSepa}
                  size="sm"
                  variant="outline"
                  className="h-8 flex items-center gap-1.5"
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
  );
}