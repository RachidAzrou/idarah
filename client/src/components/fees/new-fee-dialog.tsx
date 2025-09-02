import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/hooks/use-toast";
import { Plus, User, Calendar, CreditCard, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { calculateEndDate, toISO } from "../../../../lib/period";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface NewFeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function NewFeeDialog({ open, onOpenChange, onSuccess }: NewFeeDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("member");

  // Fetch members for dropdown
  const { data: members = [] } = useQuery({
    queryKey: ["/api/members"],
  });

  const form = useForm<NewFeeFormData>({
    resolver: zodResolver(NewFeeSchema),
    defaultValues: {
      term: 'YEARLY',
      method: 'SEPA',
      amount: 0,
      iban: '',
      note: '',
      autoCreate: false,
      periodStart: new Date().toISOString().split('T')[0],
      periodEnd: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
    },
  });

  const { watch, setValue, handleSubmit, formState: { errors }, reset } = form;
  const watchedValues = watch();

  // Auto-calculate end date when start date or term changes
  const handleStartDateChange = (date: Date) => {
    setValue('periodStart', date.toISOString().split('T')[0]);
    const endDate = calculateEndDate(date, watchedValues.term);
    setValue('periodEnd', endDate.toISOString().split('T')[0]);
  };

  const handleTermChange = (term: 'MONTHLY' | 'YEARLY') => {
    setValue('term', term);
    if (watchedValues.periodStart) {
      const startDate = new Date(watchedValues.periodStart);
      const endDate = calculateEndDate(startDate, term);
      setValue('periodEnd', endDate.toISOString().split('T')[0]);
    }
  };

  // Create fee mutation
  const createFeeMutation = useMutation({
    mutationFn: async (data: NewFeeFormData) => {
      const member = Array.isArray(members) ? members.find((m: any) => m.id === data.memberId) : null;
      if (!member) {
        throw new Error("Lid niet gevonden");
      }

      const feeData = {
        memberId: data.memberId,
        memberNumber: member.memberNumber,
        memberName: `${member.firstName} ${member.lastName}`,
        periodStart: new Date(data.periodStart!),
        periodEnd: new Date(data.periodEnd!),
        amount: data.amount,
        method: data.method,
        sepaEligible: data.method === 'SEPA',
        note: data.note || null,
        status: 'OPEN'
      };

      const response = await apiRequest("POST", "/api/fees", feeData);
      return response.json();
    },
    onSuccess: async (fee, variables) => {
      // Optimistic update - voeg fee toe aan lijst
      queryClient.setQueryData(["/api/fees"], (oldData: any) => {
        if (!Array.isArray(oldData)) return [fee];
        return [fee, ...oldData];
      });
      
      await queryClient.invalidateQueries({ queryKey: ["/api/fees"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Lidgeld aangemaakt",
        description: "Het lidgeld is succesvol aangemaakt.",
      });
      reset();
      onOpenChange(false);
      setShowConfirmDialog(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij aanmaken",
        description: error.message || "Er is een fout opgetreden bij het aanmaken van het lidgeld.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: NewFeeFormData) => {
    try {
      setIsSubmitting(true);
      createFeeMutation.mutate(data);
    } catch (error) {
      console.error('Error submitting fee:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = async (markAsPaid?: boolean, paidDate?: Date) => {
    try {
      setIsSubmitting(true);
      
      const formData = form.getValues();
      await onSubmit(formData);
      
      // For now, we create the fee as open and let the user mark it as paid separately
      // Future enhancement: integrate direct payment marking
      
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
              {/* Main Layout with Tabs */}
              <div className="grid lg:grid-cols-[1fr,420px] gap-6">
                {/* Left Column - Form with Tabs */}
                <div className="space-y-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="member" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Lid
                      </TabsTrigger>
                      <TabsTrigger value="period" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Periode
                      </TabsTrigger>
                      <TabsTrigger value="payment" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Betaling
                      </TabsTrigger>
                      <TabsTrigger value="options" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Opties
                      </TabsTrigger>
                    </TabsList>

                    <div className="min-h-[400px] py-6">
                      <TabsContent value="member" className="space-y-4 mt-0">
                        <SectionCard 
                          title="Lid" 
                          description="Selecteer het lid voor dit lidgeld"
                        >
                          <MemberSelect
                            value={watchedValues.memberId}
                            onChange={(memberId) => setValue('memberId', memberId)}
                            error={errors.memberId?.message}
                            members={Array.isArray(members) ? members : []}
                          />
                        </SectionCard>
                      </TabsContent>

                      <TabsContent value="period" className="space-y-4 mt-0">
                        <SectionCard 
                          title="Termijn & Periode" 
                          description="Kies de betalingstermijn en periode"
                        >
                          <PeriodPicker
                            term={watchedValues.term}
                            onTermChange={handleTermChange}
                            startDate={watchedValues.periodStart ? new Date(watchedValues.periodStart) : undefined}
                            onStartDateChange={handleStartDateChange}
                            endDate={watchedValues.periodEnd ? new Date(watchedValues.periodEnd) : undefined}
                            onEndDateChange={(date) => setValue('periodEnd', date.toISOString().split('T')[0])}
                            errors={{
                              term: errors.term?.message,
                              startDate: errors.periodStart?.message,
                              endDate: errors.periodEnd?.message,
                            }}
                          />
                        </SectionCard>
                      </TabsContent>

                      <TabsContent value="payment" className="space-y-4 mt-0">
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
                      </TabsContent>

                      <TabsContent value="options" className="space-y-4 mt-0">
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
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>

                {/* Right Column - Preview */}
                <div className="space-y-6">
                  <PreviewCard
                    memberId={watchedValues.memberId}
                    term={watchedValues.term}
                    method={watchedValues.method}
                    startDate={watchedValues.periodStart ? new Date(watchedValues.periodStart) : undefined}
                    endDate={watchedValues.periodEnd ? new Date(watchedValues.periodEnd) : undefined}
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