import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { format } from "date-fns";

const feeSchema = z.object({
  memberId: z.string().min(1, "Lid is verplicht"),
  periodStart: z.string().min(1, "Startdatum is verplicht"),
  periodEnd: z.string().min(1, "Einddatum is verplicht"),
  amount: z.string().min(1, "Bedrag is verplicht").refine((val) => !isNaN(parseFloat(val)), "Ongeldig bedrag"),
  method: z.enum(['SEPA', 'OVERSCHRIJVING', 'BANCONTACT', 'CASH']).optional(),
});

type FeeFormData = z.infer<typeof feeSchema>;

interface FeeFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  selectedMemberId?: string;
}

export function FeeForm({ onSuccess, onCancel, selectedMemberId }: FeeFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: members } = useQuery({
    queryKey: ["/api/members"],
  });

  const form = useForm<FeeFormData>({
    resolver: zodResolver(feeSchema),
    defaultValues: {
      memberId: selectedMemberId || "",
      periodStart: format(new Date(), 'yyyy-MM-dd'),
      periodEnd: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'),
      amount: "25.00",
    },
  });

  const createFeeMutation = useMutation({
    mutationFn: async (data: FeeFormData) => {
      const feeData = {
        ...data,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        amount: data.amount,
      };
      const response = await apiRequest("POST", "/api/fees", feeData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Lidgeld aangemaakt",
        description: "Het lidgeld is succesvol toegevoegd.",
      });
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

  const onSubmit = (data: FeeFormData) => {
    createFeeMutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Nieuw Lidgeld Toevoegen</CardTitle>
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel} data-testid="button-cancel">
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="memberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lid</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-member">
                        <SelectValue placeholder="Selecteer een lid" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {members?.map((member: any) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.firstName} {member.lastName} ({member.memberNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="periodStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Startdatum</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-period-start" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="periodEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Einddatum</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-period-end" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bedrag (€)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="25.00" {...field} data-testid="input-amount" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Betaalmethode (optioneel)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-payment-method">
                        <SelectValue placeholder="Selecteer betaalmethode" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SEPA">SEPA Incasso</SelectItem>
                      <SelectItem value="OVERSCHRIJVING">Overschrijving</SelectItem>
                      <SelectItem value="BANCONTACT">Bancontact</SelectItem>
                      <SelectItem value="CASH">Contant</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-6 border-t">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-form">
                  Annuleren
                </Button>
              )}
              <Button
                type="submit"
                disabled={createFeeMutation.isPending}
                data-testid="button-submit"
              >
                {createFeeMutation.isPending ? "Lidgeld wordt aangemaakt..." : "Lidgeld Aanmaken"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
