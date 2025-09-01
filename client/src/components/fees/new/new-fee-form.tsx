import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/ui/section-card";
import { MemberSelect } from "./member-select";
import { PeriodPicker } from "./period-picker";
import { MethodTerm } from "./method-term";
import { AmountInput } from "./amount-input";
import { PreviewCard } from "./preview-card";
import { ConfirmDialog } from "./confirm-dialog";
import { NewFeeSchema, type NewFeeFormData } from "../../../../../lib/zod-fee";
import { createFee, markPaid } from "../../../../../lib/mock/fees-store";
import { membersLite } from "../../../../../lib/mock/members-lite";
import { calculateEndDate, toISO } from "../../../../../lib/period";

export function NewFeeForm() {
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

  const { watch, setValue, handleSubmit, formState: { errors } } = form;
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
      
      // Navigate to fees page (would be router.push('/fees') in a real app)
      window.location.href = '/lidgelden';
      
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

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Nieuw lidgeld
        </h1>
        <p className="text-gray-600">
          Maak een nieuw lidgeld aan voor een lid en periode
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()}>
          {/* Main Layout */}
          <div className="grid lg:grid-cols-[1fr,420px] gap-8">
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

              <Button 
                onClick={validateAndShowConfirm}
                className="w-full h-12 text-base font-medium"
                size="lg"
                data-testid="create-fee-button"
              >
                Lidgeld aanmaken
              </Button>
            </div>
          </div>
        </form>
      </Form>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirm}
        loading={isSubmitting}
      />
    </div>
  );
}