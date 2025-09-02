import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface FilterValues {
  periodFrom?: Date;
  periodTo?: Date;
  categories: string[];
  amountMin?: number;
  amountMax?: number;
  paidFrom?: Date;
  paidTo?: Date;
  onlyWithMandate: boolean;
  onlyOverdue: boolean;
}

interface FiltersDrawerProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  onReset: () => void;
}

export function FiltersDrawer({ filters, onFiltersChange, onReset }: FiltersDrawerProps) {
  const [open, setOpen] = useState(false);

  const updateFilter = (key: keyof FilterValues, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    updateFilter("categories", newCategories);
  };

  const categories = ["STUDENT", "VOLWASSEN", "SENIOR"];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Geavanceerde filters
        </Button>
      </SheetTrigger>
      <SheetContent className="w-96 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Geavanceerde filters</SheetTitle>
          <SheetDescription>
            Verfijn je zoekresultaten met uitgebreide filteropties
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Period Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Periode</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-500">Van</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.periodFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.periodFrom ? format(filters.periodFrom, "dd-MM-yyyy", { locale: nl }) : "Selecteer datum"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.periodFrom}
                      onSelect={(date) => updateFilter("periodFrom", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Tot</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.periodTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.periodTo ? format(filters.periodTo, "dd-MM-yyyy", { locale: nl }) : "Selecteer datum"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.periodTo}
                      onSelect={(date) => updateFilter("periodTo", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Categorieën</Label>
            <div className="space-y-2">
              {categories.map(category => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={category}
                    checked={filters.categories.includes(category)}
                    onCheckedChange={() => toggleCategory(category)}
                  />
                  <Label htmlFor={category} className="text-sm">
                    {category === "STUDENT" ? "Student" :
                     category === "STANDAARD" ? "Standaard" : "Senior"}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Amount Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Bedrag (€)</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-500">Minimum</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.amountMin || ""}
                  onChange={(e) => updateFilter("amountMin", e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Maximum</Label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={filters.amountMax || ""}
                  onChange={(e) => updateFilter("amountMax", e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
            </div>
          </div>

          {/* Paid Date Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Betaald op</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-500">Van</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.paidFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.paidFrom ? format(filters.paidFrom, "dd-MM-yyyy", { locale: nl }) : "Selecteer datum"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.paidFrom}
                      onSelect={(date) => updateFilter("paidFrom", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Tot</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.paidTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.paidTo ? format(filters.paidTo, "dd-MM-yyyy", { locale: nl }) : "Selecteer datum"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.paidTo}
                      onSelect={(date) => updateFilter("paidTo", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="onlyWithMandate"
                checked={filters.onlyWithMandate}
                onCheckedChange={(checked) => updateFilter("onlyWithMandate", checked)}
              />
              <Label htmlFor="onlyWithMandate" className="text-sm">
                Alleen met SEPA-mandaat
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="onlyOverdue"
                checked={filters.onlyOverdue}
                onCheckedChange={(checked) => updateFilter("onlyOverdue", checked)}
              />
              <Label htmlFor="onlyOverdue" className="text-sm">
                Alleen achterstallig
              </Label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={() => setOpen(false)} className="flex-1">
              Toepassen
            </Button>
            <Button onClick={onReset} variant="outline" className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}