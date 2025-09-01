import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { euroInputMask, parseEuroInput, formatCurrencyBE } from "../../../../../lib/period";

interface AmountInputProps {
  value: number;
  onChange: (amount: number) => void;
  error?: string;
}

export function AmountInput({ value, onChange, error }: AmountInputProps) {
  const [displayValue, setDisplayValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Update display value when value prop changes
  useEffect(() => {
    if (!isFocused) {
      if (value > 0) {
        setDisplayValue(value.toString().replace('.', ','));
      } else {
        setDisplayValue("");
      }
    }
  }, [value, isFocused]);

  const handleInputChange = (inputValue: string) => {
    const masked = euroInputMask(inputValue);
    setDisplayValue(masked);
    
    const numericValue = parseEuroInput(masked);
    onChange(numericValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Show raw numeric value when focused
    if (value > 0) {
      setDisplayValue(value.toString().replace('.', ','));
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format as currency when not focused
    if (value > 0) {
      setDisplayValue(value.toString().replace('.', ','));
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        Bedrag
        <span className="text-red-500 ml-1">*</span>
      </Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
          €
        </span>
        <Input
          value={displayValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="0,00"
          className={cn(
            "w-full h-10 border-gray-200 pl-8 text-right",
            error && "border-red-500"
          )}
          data-testid="amount-input"
        />
      </div>
      {!isFocused && value > 0 && (
        <p className="text-sm text-gray-600">
          Weergave: {formatCurrencyBE(value)}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <p className="text-xs text-gray-500">
        Gebruik komma voor decimalen (bijv. 25,50)
      </p>
    </div>
  );
}