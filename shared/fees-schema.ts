import { z } from "zod";

export const feeStatusSchema = z.enum(['OPEN', 'PAID', 'OVERDUE']);
export const paymentMethodSchema = z.enum(['SEPA', 'OVERSCHRIJVING', 'BANCONTACT', 'CASH']);

export const feeSchema = z.object({
  id: z.string(),
  memberId: z.string(),
  memberNumber: z.string(),
  memberLastName: z.string(),
  memberFirstName: z.string(),
  memberEmail: z.string(),
  memberPhone: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),
  amount: z.number(),
  dueDate: z.string(),
  category: z.string(),
  method: paymentMethodSchema,
  status: feeStatusSchema,
  paidAt: z.string().optional(),
  transactionId: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  hasMandate: z.boolean().optional(),
  sepaBatchRef: z.string().optional(),
});

export const importFileSchema = z.object({
  type: z.enum(['CSV', 'MT940', 'CODA']),
  file: z.instanceof(File),
});

export const filterSchema = z.object({
  search: z.string(),
  status: z.string(),
  year: z.string(),
  method: z.string(),
  periodFrom: z.string().optional(),
  periodTo: z.string().optional(),
  categories: z.array(z.string()),
  amountMin: z.number().optional(),
  amountMax: z.number().optional(),
  paidFrom: z.string().optional(),
  paidTo: z.string().optional(),
  onlyWithMandate: z.boolean(),
  onlyOverdue: z.boolean(),
});

export type FeeStatus = z.infer<typeof feeStatusSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type Fee = z.infer<typeof feeSchema>;
export type ImportFile = z.infer<typeof importFileSchema>;
export type FilterValues = z.infer<typeof filterSchema>;