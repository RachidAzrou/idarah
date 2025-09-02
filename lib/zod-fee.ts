import { z } from "zod";

// Fee validation schema
export const NewFeeSchema = z.object({
  memberId: z.string().optional(),
  memberNumber: z.string().optional(),
  term: z.enum(['MONTHLY', 'YEARLY']),
  method: z.enum(['SEPA', 'OVERSCHRIJVING', 'BANCONTACT', 'CASH']),
  amount: z.number().min(0, "Amount must be greater than or equal to 0"),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(), 
  iban: z.string().optional(),
  note: z.string().optional(),
  autoCreate: z.boolean().default(false),
});

export type NewFeeFormData = z.infer<typeof NewFeeSchema>;

// Fee update schema
export const UpdateFeeSchema = z.object({
  amount: z.number().min(0).optional(),
  method: z.enum(['SEPA', 'OVERSCHRIJVING', 'BANCONTACT', 'CASH']).optional(),
  status: z.enum(['OPEN', 'PAID', 'OVERDUE']).optional(),
  note: z.string().optional(),
});

export type UpdateFeeFormData = z.infer<typeof UpdateFeeSchema>;