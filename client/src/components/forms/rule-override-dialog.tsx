import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useVotingRightsOverride } from "@/hooks/useRuleValidation";

interface RuleOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  memberName: string;
  currentStatus: boolean;
  warnings: string[];
  ruleScope: 'STEMRECHT' | 'VERKIESBAAR';
  onSuccess?: () => void;
}

export function RuleOverrideDialog({
  open,
  onOpenChange,
  memberId,
  memberName,
  currentStatus,
  warnings,
  ruleScope,
  onSuccess
}: RuleOverrideDialogProps) {
  const [overrideValue, setOverrideValue] = useState<string>(currentStatus ? 'true' : 'false');
  const [reason, setReason] = useState('');
  const { toast } = useToast();
  
  const overrideMutation = useVotingRightsOverride();

  const scopeLabels = {
    'STEMRECHT': 'stemrecht',
    'VERKIESBAAR': 'verkiesbaarheid'
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast({
        title: "Reden vereist",
        description: "Geef een reden op voor deze handmatige toekenning.",
        variant: "destructive",
      });
      return;
    }

    try {
      await overrideMutation.mutateAsync({
        memberId,
        overrideValue: overrideValue === 'true',
        reason: reason.trim()
      });

      toast({
        title: "Override toegepast",
        description: `${scopeLabels[ruleScope]} voor ${memberName} is handmatig ${overrideValue === 'true' ? 'toegekend' : 'ingetrokken'}.`,
      });

      onSuccess?.();
      onOpenChange(false);
      setReason('');
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het toepassen van de override.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Handmatige toekenning {scopeLabels[ruleScope]}
          </DialogTitle>
          <DialogDescription>
            Handmatig toekennen van {scopeLabels[ruleScope]} voor <strong>{memberName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Waarschuwingen tonen */}
          {warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <h4 className="text-sm font-medium text-amber-800 mb-2">
                Regelovertredingen gedetecteerd:
              </h4>
              <ul className="text-sm text-amber-700 space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Override keuze */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {scopeLabels[ruleScope]} toekennen aan {memberName}?
            </Label>
            
            <RadioGroup value={overrideValue} onValueChange={setOverrideValue}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="grant" />
                <Label htmlFor="grant" className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Ja, {scopeLabels[ruleScope]} handmatig toekennen
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="deny" />
                <Label htmlFor="deny" className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Nee, {scopeLabels[ruleScope]} intrekken
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Reden */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              Reden voor handmatige toekenning *
            </Label>
            <Textarea
              id="reason"
              placeholder={`Leg uit waarom je ${scopeLabels[ruleScope]} handmatig ${overrideValue === 'true' ? 'toekent' : 'intrekt'}...`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Deze reden wordt vastgelegd voor controle en auditdoeleinden.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setReason('');
              }}
            >
              Annuleren
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!reason.trim() || overrideMutation.isPending}
              className={overrideValue === 'true' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {overrideMutation.isPending ? 'Bezig...' : 
               overrideValue === 'true' ? 'Toekennen' : 'Intrekken'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}