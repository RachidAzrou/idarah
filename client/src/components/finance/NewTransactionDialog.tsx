"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TransactionSchema, TransactionFormData } from "@/lib/zod/transaction";
import { categories } from "@/lib/mock/transactions";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface NewTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  editTransaction?: any | null;
}

export function NewTransactionDialog({
  open,
  onClose,
  editTransaction
}: NewTransactionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basis');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isEditing = !!editTransaction;

  // Fetch members for dropdown
  const { data: members = [] } = useQuery({
    queryKey: ["/api/members"],
  });
  
  const form = useForm<TransactionFormData>({
    resolver: zodResolver(TransactionSchema),
    defaultValues: {
      type: editTransaction?.type || 'INCOME',
      date: editTransaction?.date || format(new Date(), 'yyyy-MM-dd'),
      category: editTransaction?.category || '',
      amount: editTransaction?.amount || 0,
      method: editTransaction?.method || 'SEPA',
      memberId: editTransaction?.memberId || '',
      memberName: editTransaction?.memberName || '',
      description: editTransaction?.description || ''
    }
  });

  const selectedType = form.watch('type');
  const selectedMemberId = form.watch('memberId');
  
  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const response = await apiRequest("POST", "/api/transactions", data);
      return response.json();
    },
    onSuccess: async (newTransaction, variables) => {
      // Optimistic update - voeg transactie toe aan lijst
      queryClient.setQueryData(["/api/transactions"], (oldData: any) => {
        if (!Array.isArray(oldData)) return [newTransaction];
        return [newTransaction, ...oldData];
      });
      
      await queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/financial/reports"] });
      toast({
        title: "Transactie toegevoegd",
        description: `${variables.type === 'INCOME' ? 'Inkomst' : 'Uitgave'} van €${variables.amount} is toegevoegd.`,
      });
      setLoading(false);
      handleClose();
    },
    onError: (error: any) => {
      console.error('Create transaction error:', error);
      toast({
        title: "Fout bij toevoegen transactie",
        description: error?.message || "Er is een fout opgetreden bij het toevoegen van de transactie.",
        variant: "destructive",
      });
      setLoading(false);
    },
  });

  // Edit transaction mutation
  const editTransactionMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const response = await apiRequest("PUT", `/api/transactions/${editTransaction.id}`, data);
      return response.json();
    },
    onSuccess: async (updatedTransaction, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/financial/reports"] });
      toast({
        title: "Transactie bijgewerkt",
        description: `Wijzigingen zijn opgeslagen.`,
      });
      setLoading(false);
      handleClose();
    },
    onError: (error: any) => {
      console.error('Edit transaction error:', error);
      toast({
        title: "Fout bij bijwerken transactie",
        description: error?.message || "Er is een fout opgetreden bij het bijwerken van de transactie.",
        variant: "destructive",
      });
      setLoading(false);
    },
  });

  // Handle member change to auto-fill member name
  const handleMemberChange = (memberId: string) => {
    if (memberId === "none" || !memberId) {
      form.setValue("memberName", "");
      return;
    }
    
    const member = Array.isArray(members) ? members.find((m: any) => m.id === memberId) : null;
    if (member) {
      form.setValue("memberName", `${member.firstName} ${member.lastName}`);
    }
  };

  const onSubmit = async (data: TransactionFormData) => {
    try {
      setLoading(true);
      
      // Clean up memberId if "none" selected
      if (data.memberId === "none" || !data.memberId) {
        data.memberId = "";
        data.memberName = "";
      }

      if (isEditing) {
        editTransactionMutation.mutate(data);
      } else {
        createTransactionMutation.mutate(data);
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!isEditing) {
      form.reset();
    }
    setActiveTab('basis');
    onClose();
  };

  const nextTab = () => {
    if (activeTab === 'basis') setActiveTab('details');
    else if (activeTab === 'details') setActiveTab('overzicht');
  };

  const prevTab = () => {
    if (activeTab === 'details') setActiveTab('basis');
    else if (activeTab === 'overzicht') setActiveTab('details');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] min-h-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Transactie bewerken' : 'Nieuwe transactie'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Wijzig de details van deze transactie.'
              : 'Voeg een nieuwe inkomst of uitgave toe aan je financiële administratie.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basis">Basis Gegevens</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="overzicht">Overzicht</TabsTrigger>
              </TabsList>

              <TabsContent value="basis" className="space-y-6 mt-6">
                {/* Type */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-transaction-type">
                            <SelectValue placeholder="Selecteer type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="INCOME">Inkomsten</SelectItem>
                          <SelectItem value="EXPENSE">Uitgaven</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date and Amount Row */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Datum *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            data-testid="input-transaction-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bedrag (€) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0,00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-transaction-amount"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Category */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categorie *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-transaction-category">
                            <SelectValue placeholder="Selecteer categorie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories[selectedType].map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="details" className="space-y-6 mt-6">
                {/* Payment Method */}
                <FormField
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Betaalmethode *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-transaction-method">
                            <SelectValue placeholder="Selecteer methode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SEPA">SEPA</SelectItem>
                          <SelectItem value="OVERSCHRIJVING">Overschrijving</SelectItem>
                          <SelectItem value="BANCONTACT">Bancontact</SelectItem>
                          <SelectItem value="CASH">Contant</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Member (Optional) */}
                <FormField
                  control={form.control}
                  name="memberId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lid (optioneel)</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleMemberChange(value);
                        }} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-transaction-member">
                            <SelectValue placeholder="Selecteer lid" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Geen lid gekoppeld</SelectItem>
                          {Array.isArray(members) && members.map((member: any) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.firstName} {member.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Koppel deze transactie aan een specifiek lid (bijv. voor lidgeld)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Omschrijving (optioneel)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Voeg een omschrijving toe..."
                          className="resize-none"
                          rows={3}
                          {...field}
                          data-testid="input-transaction-description"
                        />
                      </FormControl>
                      <FormDescription>
                        Maximaal 500 karakters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="overzicht" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Overzicht van de transactie</h3>
                  
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <span className="font-medium">Type:</span>
                      <p className="text-sm text-muted-foreground">
                        {form.watch('type') === 'INCOME' ? 'Inkomsten' : 'Uitgaven'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Bedrag:</span>
                      <p className="text-sm text-muted-foreground">€{form.watch('amount') || 0}</p>
                    </div>
                    <div>
                      <span className="font-medium">Datum:</span>
                      <p className="text-sm text-muted-foreground">{form.watch('date')}</p>
                    </div>
                    <div>
                      <span className="font-medium">Categorie:</span>
                      <p className="text-sm text-muted-foreground">{form.watch('category') || 'Niet geselecteerd'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Betaalmethode:</span>
                      <p className="text-sm text-muted-foreground">{form.watch('method')}</p>
                    </div>
                    <div>
                      <span className="font-medium">Lid:</span>
                      <p className="text-sm text-muted-foreground">
                        {form.watch('memberName') || 'Geen lid gekoppeld'}
                      </p>
                    </div>
                  </div>
                  
                  {form.watch('description') && (
                    <div className="p-4 bg-muted rounded-lg">
                      <span className="font-medium">Omschrijving:</span>
                      <p className="text-sm text-muted-foreground mt-1">{form.watch('description')}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex justify-between items-center mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                data-testid="button-cancel-transaction"
              >
                Annuleren
              </Button>
              
              <div className="flex gap-2">
                {activeTab !== 'basis' && (
                  <Button type="button" variant="outline" onClick={prevTab}>
                    Vorige
                  </Button>
                )}
                {activeTab !== 'overzicht' && (
                  <Button type="button" onClick={nextTab}>
                    Volgende
                  </Button>
                )}
                <Button 
                  type="submit" 
                  disabled={loading || activeTab !== 'overzicht'}
                  variant={activeTab === 'overzicht' ? 'default' : 'outline'}
                  data-testid="button-save-transaction"
                >
                  {loading ? 'Bezig...' : (isEditing ? 'Wijzigingen opslaan' : 'Transactie toevoegen')}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}