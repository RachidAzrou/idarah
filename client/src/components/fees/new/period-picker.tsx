import { useState, useEffect } from "react";
import { CalendarIcon } from "lucide-react";
import { format, nl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatDateBE, calculateEndDate } from "../../../../../lib/period";

interface PeriodPickerProps {
  term: 'MONTHLY' | 'YEARLY';
  onTermChange: (term: 'MONTHLY' | 'YEARLY') => void;
  startDate?: Date;
  onStartDateChange: (date: Date) => void;
  endDate?: Date;
  onEndDateChange: (date: Date) => void;
  errors?: {
    term?: string;
    startDate?: string;
    endDate?: string;
  };
}

export function PeriodPicker({ 
  term, 
  onTermChange, 
  startDate, 
  onStartDateChange, 
  endDate,
  onEndDateChange,
  errors = {} 
}: PeriodPickerProps) {
  const [startDateInput, setStartDateInput] = useState("");
  const [startPopoverOpen, setStartPopoverOpen] = useState(false);

  // Update end date when start date or term changes
  useEffect(() => {
    if (startDate) {
      const newEndDate = calculateEndDate(startDate, term);
      onEndDateChange(newEndDate);
    }
  }, [startDate, term, onEndDateChange]);

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

  const handleStartDateInput = (value: string) => {
    const formatted = formatDateInput(value);
    setStartDateInput(formatted);
    
    const parsedDate = parseDate(formatted);
    if (parsedDate) {
      onStartDateChange(parsedDate);
    }
  };

  return (
    <div className="space-y-6">
      {/* Term Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Termijn</Label>
        <RadioGroup 
          value={term} 
          onValueChange={(value) => onTermChange(value as 'MONTHLY' | 'YEARLY')}
          className="flex gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="MONTHLY" id="monthly" />
            <Label htmlFor="monthly" className="text-sm cursor-pointer">
              Maandelijks
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="YEARLY" id="yearly" />
            <Label htmlFor="yearly" className="text-sm cursor-pointer">
              Jaarlijks
            </Label>
          </div>
        </RadioGroup>
        {errors.term && (
          <p className="text-sm text-red-600">{errors.term}</p>
        )}
      </div>

      {/* Start Date */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Startdatum</Label>
        <div className="relative">
          <Input
            value={startDateInput || (startDate ? formatDateBE(startDate) : "")}
            onChange={(e) => handleStartDateInput(e.target.value)}
            placeholder="dd/mm/jjjj"
            className={cn(
              "w-full h-10 border-gray-200 pr-10",
              errors.startDate && "border-red-500"
            )}
            data-testid="start-date-input"
            maxLength={10}
          />
          <Popover open={startPopoverOpen} onOpenChange={setStartPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-100"
                onClick={() => setStartPopoverOpen(true)}
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => {
                  if (date) {
                    onStartDateChange(date);
                    setStartDateInput("");
                    setStartPopoverOpen(false);
                  }
                }}
                locale={nl}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        {errors.startDate && (
          <p className="text-sm text-red-600">{errors.startDate}</p>
        )}
      </div>

      {/* End Date (read-only) */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Einddatum</Label>
        <Input
          value={endDate ? formatDateBE(endDate) : ""}
          readOnly
          className="w-full h-10 border-gray-200 bg-gray-50 text-gray-600"
          placeholder="Wordt automatisch berekend"
          data-testid="end-date-display"
        />
        <p className="text-xs text-gray-500">
          {term === 'MONTHLY' ? 
            'Automatisch ingesteld op de laatste dag van de startmaand' : 
            'Automatisch ingesteld op één jaar na de startdatum'
          }
        </p>
        {errors.endDate && (
          <p className="text-sm text-red-600">{errors.endDate}</p>
        )}
      </div>
    </div>
  );
}