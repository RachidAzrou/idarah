import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/ui/section-card";
import { MemberSelect } from "./new/member-select";
import { PeriodPicker } from "./new/period-picker";
import { MethodTerm } from "./new/method-term";
import { AmountInput } from "./new/amount-input";
import { PreviewCard } from "./new/preview-card";
import { ConfirmDialog } from "./new/confirm-dialog";
import { NewFeeSchema, type NewFeeFormData } from "../../../../lib/zod-fee";
import { createFee, markPaid } from "../../../../lib/mock/fees-store";
import { membersLite } from "../../../../lib/mock/members-lite";
import { calculateEndDate, toISO } from "../../../../lib/period";

interface NewFeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function NewFeeDialog({ open, onOpenChange, onSuccess }: NewFeeDialogProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NewFeeFormData>({
    resolver: zodResolver(NewFeeSchema),
    defaultValues: {
      term: 'YEARLY',
      method: 'SEPA',
      amount: 0,
      iban: '',
      note: '',
      autoCreate: false,
    },
  });

  const { watch, setValue, handleSubmit, formState: { errors }, reset } = form;
  const watchedValues = watch();

  // Auto-calculate end date when start date or term changes
  const handleStartDateChange = (date: Date) => {
    setValue('startDate', date);
    const endDate = calculateEndDate(date, watchedValues.term);
    setValue('endDate', endDate);
  };

  const handleTermChange = (term: 'MONTHLY' | 'YEARLY') => {
    setValue('term', term);
    if (watchedValues.startDate) {
      const endDate = calculateEndDate(watchedValues.startDate, term);
      setValue('endDate', endDate);
    }
  };

  const onSubmit = async (data: NewFeeFormData) => {
    try {
      setIsSubmitting(true);
      
      const member = membersLite.find(m => m.id === data.memberId);
      if (!member) {
        toast({
          title: "Fout",
          description: "Lid niet gevonden",
          variant: "destructive",
        });
        return;
      }

      // Create the fee
      const newFee = createFee({
        memberId: data.memberId,
        memberNumber: member.memberNumber,
        memberName: `${member.firstName} ${member.lastName}`,
        periodStart: toISO(data.startDate),
        periodEnd: toISO(data.endDate),
        amount: data.amount,
        method: data.method,
        sepaEligible: data.method === 'SEPA' && member.hasMandate && !!data.iban,
        note: data.note || undefined,
      });

      toast({
        title: "Succes",
        description: "Lidgeld succesvol aangemaakt",
      });

      return newFee;
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er ging iets mis bij het aanmaken van het lidgeld",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = async (markAsPaid?: boolean, paidDate?: Date) => {
    try {
      setIsSubmitting(true);
      
      const formData = form.getValues();
      const newFee = await onSubmit(formData);
      
      if (newFee && markAsPaid && paidDate) {
        markPaid(newFee.id, toISO(paidDate));
        toast({
          title: "Lidgeld gemarkeerd als betaald",
          description: `Betaaldatum: ${paidDate.toLocaleDateString('nl-BE')}`,
        });
      }

      setShowConfirmDialog(false);
      reset();
      onOpenChange(false);
      if (onSuccess) onSuccess();
      
    } catch (error) {
      // Error is already handled in onSubmit
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateAndShowConfirm = () => {
    form.handleSubmit(() => {
      setShowConfirmDialog(true);
    })();
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      reset();
    }
    onOpenChange(open);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nieuw lidgeld
            </DialogTitle>
            <DialogDescription>
              Maak een nieuw lidgeld aan voor een lid en periode
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()}>
              {/* Main Layout */}
              <div className="grid lg:grid-cols-[1fr,420px] gap-6">
                {/* Left Column - Form */}
                <div className="space-y-6">
                  {/* Member Selection */}
                  <SectionCard 
                    title="Lid" 
                    description="Selecteer het lid voor dit lidgeld"
                  >
                    <MemberSelect
                      value={watchedValues.memberId}
                      onChange={(memberId) => setValue('memberId', memberId)}
                      error={errors.memberId?.message}
                    />
                  </SectionCard>

                  {/* Period */}
                  <SectionCard 
                    title="Termijn & Periode" 
                    description="Kies de betalingstermijn en periode"
                  >
                    <PeriodPicker
                      term={watchedValues.term}
                      onTermChange={handleTermChange}
                      startDate={watchedValues.startDate}
                      onStartDateChange={handleStartDateChange}
                      endDate={watchedValues.endDate}
                      onEndDateChange={(date) => setValue('endDate', date)}
                      errors={{
                        term: errors.term?.message,
                        startDate: errors.startDate?.message,
                        endDate: errors.endDate?.message,
                      }}
                    />
                  </SectionCard>

                  {/* Method & Amount */}
                  <SectionCard 
                    title="Methode & Bedrag" 
                    description="Kies de betalingsmethode en bedrag"
                  >
                    <div className="space-y-6">
                      <MethodTerm
                        method={watchedValues.method}
                        onMethodChange={(method) => setValue('method', method)}
                        iban={watchedValues.iban}
                        onIbanChange={(iban) => setValue('iban', iban)}
                        errors={{
                          method: errors.method?.message,
                          iban: errors.iban?.message,
                        }}
                      />
                      
                      <AmountInput
                        value={watchedValues.amount}
                        onChange={(amount) => setValue('amount', amount)}
                        error={errors.amount?.message}
                      />
                    </div>
                  </SectionCard>

                  {/* Options */}
                  <SectionCard 
                    title="Opties" 
                    description="Aanvullende instellingen"
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Notitie (optioneel)</Label>
                        <Textarea
                          value={watchedValues.note || ''}
                          onChange={(e) => setValue('note', e.target.value)}
                          placeholder="Voeg een notitie toe..."
                          className="min-h-[80px] border-gray-200"
                          maxLength={500}
                        />
                        <p className="text-xs text-gray-500">
                          Maximaal 500 karakters
                        </p>
                      </div>
                    </div>
                  </SectionCard>
                </div>

                {/* Right Column - Preview */}
                <div className="space-y-6">
                  <PreviewCard
                    memberId={watchedValues.memberId}
                    term={watchedValues.term}
                    method={watchedValues.method}
                    startDate={watchedValues.startDate}
                    endDate={watchedValues.endDate}
                    amount={watchedValues.amount}
                    iban={watchedValues.iban}
                    note={watchedValues.note}
                  />

                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => handleDialogClose(false)}
                      className="flex-1"
                    >
                      Annuleren
                    </Button>
                    <Button 
                      onClick={validateAndShowConfirm}
                      className="flex-1"
                      data-testid="create-fee-button"
                    >
                      Lidgeld aanmaken
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirm}
        loading={isSubmitting}
      />
    </>
  );
}