import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { formatDateBE } from "../../../../../lib/period";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (markAsPaid?: boolean, paidDate?: Date) => void;
  loading?: boolean;
}

export function ConfirmDialog({ open, onOpenChange, onConfirm, loading = false }: ConfirmDialogProps) {
  const [markAsPaid, setMarkAsPaid] = useState(false);
  const [paidDate, setPaidDate] = useState<Date>(new Date());
  const [paidDateInput, setPaidDateInput] = useState("");
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

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

  const handlePaidDateInput = (value: string) => {
    const formatted = formatDateInput(value);
    setPaidDateInput(formatted);
    
    const parsedDate = parseDate(formatted);
    if (parsedDate) {
      setPaidDate(parsedDate);
    }
  };

  const handleConfirm = () => {
    onConfirm(markAsPaid, markAsPaid ? paidDate : undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lidgeld bevestigen</DialogTitle>
          <DialogDescription>
            Weet je zeker dat je dit lidgeld wilt aanmaken?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="mark-paid"
              checked={markAsPaid}
              onCheckedChange={(checked) => setMarkAsPaid(checked as boolean)}
            />
            <Label htmlFor="mark-paid" className="text-sm cursor-pointer">
              Markeer als betaald
            </Label>
          </div>

          {markAsPaid && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Betaaldatum</Label>
              <div className="relative">
                <Input
                  value={paidDateInput || formatDateBE(paidDate)}
                  onChange={(e) => handlePaidDateInput(e.target.value)}
                  placeholder="dd/mm/jjjj"
                  className="w-full h-9 border-gray-200 pr-10"
                  maxLength={10}
                />
                <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-100"
                      onClick={() => setDatePopoverOpen(true)}
                    >
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={paidDate}
                      onSelect={(date) => {
                        if (date) {
                          setPaidDate(date);
                          setPaidDateInput("");
                          setDatePopoverOpen(false);
                        }
                      }}
                      locale={nl}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <p className="text-xs text-gray-500">
                Kies de datum waarop het lidgeld werd betaald
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuleren
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            data-testid="confirm-create-fee"
          >
            {loading ? "Bezig..." : "Lidgeld aanmaken"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}