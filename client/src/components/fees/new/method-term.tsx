import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PaymentMethod = 'SEPA' | 'OVERSCHRIJVING' | 'BANCONTACT' | 'CASH';

interface MethodTermProps {
  method: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  iban?: string;
  onIbanChange: (iban: string) => void;
  errors?: {
    method?: string;
    iban?: string;
  };
}

const methodLabels = {
  SEPA: 'SEPA Domiciliëring',
  OVERSCHRIJVING: 'Overschrijving',
  BANCONTACT: 'Bancontact',
  CASH: 'Contant'
};

export function MethodTerm({ 
  method, 
  onMethodChange, 
  iban = '', 
  onIbanChange, 
  errors = {} 
}: MethodTermProps) {
  const formatIban = (value: string) => {
    // Remove all non-alphanumeric characters
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    
    // Add spaces every 4 characters
    const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
    
    return formatted;
  };

  const handleIbanChange = (value: string) => {
    const formatted = formatIban(value);
    onIbanChange(formatted);
  };

  return (
    <div className="space-y-6">
      {/* Payment Method */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Betalingsmethode</Label>
        <Select value={method} onValueChange={(value) => onMethodChange(value as PaymentMethod)}>
          <SelectTrigger 
            className={cn(
              "w-full h-10 border-gray-200",
              errors.method && "border-red-500"
            )}
            data-testid="method-select"
          >
            <SelectValue placeholder="Selecteer betalingsmethode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SEPA">SEPA Domiciliëring</SelectItem>
            <SelectItem value="OVERSCHRIJVING">Overschrijving</SelectItem>
            <SelectItem value="BANCONTACT">Bancontact</SelectItem>
            <SelectItem value="CASH">Contant</SelectItem>
          </SelectContent>
        </Select>
        {errors.method && (
          <p className="text-sm text-red-600">{errors.method}</p>
        )}
      </div>

      {/* IBAN (only for SEPA) */}
      {method === 'SEPA' && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            IBAN Rekeningnummer
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            value={iban}
            onChange={(e) => handleIbanChange(e.target.value)}
            placeholder="BE71 0961 2345 6769"
            className={cn(
              "w-full h-10 border-gray-200 font-mono text-sm",
              errors.iban && "border-red-500"
            )}
            data-testid="iban-input"
            maxLength={19} // BE + 2 digits + 12 digits + spaces
          />
          {errors.iban && (
            <p className="text-sm text-red-600">{errors.iban}</p>
          )}
          <p className="text-xs text-gray-500">
            Vereist voor SEPA domiciliëring. Formaat: BE71 0961 2345 6769
          </p>
        </div>
      )}

      {/* Method description */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          {method === 'SEPA' && 'Automatische incasso via SEPA domiciliëring. Vereist een geldig mandaat.'}
          {method === 'OVERSCHRIJVING' && 'Handmatige overschrijving door het lid. Factuur wordt verstuurd.'}
          {method === 'BANCONTACT' && 'Elektronische betaling via Bancontact terminal.'}
          {method === 'CASH' && 'Contante betaling bij de moskee.'}
        </p>
      </div>
    </div>
  );
}