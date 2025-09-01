"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TransactionSchema, TransactionFormData } from "@/lib/zod/transaction";
import { categories, mockMembers, Transaction, generateTransactionId } from "@/lib/mock/transactions";
import { format } from "date-fns";

interface NewTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  editTransaction?: Transaction | null;
}

export function NewTransactionDialog({
  open,
  onClose,
  onSave,
  editTransaction
}: NewTransactionDialogProps) {
  const [loading, setLoading] = useState(false);
  
  const isEditing = !!editTransaction;
  
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
  
  // Update member name when member is selected
  const handleMemberChange = (memberId: string) => {
    const member = mockMembers.find(m => m.id === memberId);
    form.setValue('memberName', member?.name || '');
  };

  const onSubmit = async (data: TransactionFormData) => {
    setLoading(true);
    try {
      const transaction: Transaction = {
        id: editTransaction?.id || generateTransactionId(),
        date: data.date,
        type: data.type,
        category: data.category,
        amount: data.amount,
        method: data.method,
        memberId: data.memberId || undefined,
        memberName: data.memberName || undefined,
        description: data.description || undefined
      };
      
      onSave(transaction);
      
      if (!isEditing) {
        form.reset();
      }
      onClose();
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
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      <SelectItem value="">Geen lid gekoppeld</SelectItem>
                      {mockMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
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

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                data-testid="button-cancel-transaction"
              >
                Annuleren
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                data-testid="button-save-transaction"
              >
                {loading ? 'Bezig...' : (isEditing ? 'Wijzigingen opslaan' : 'Transactie toevoegen')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}