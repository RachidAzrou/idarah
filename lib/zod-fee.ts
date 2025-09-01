import { z } from 'zod';

export const NewFeeSchema = z.object({
  memberId: z.string().min(1, 'Selecteer een lid'),
  term: z.enum(['MONTHLY','YEARLY']),
  method: z.enum(['SEPA','OVERSCHRIJVING','BANCONTACT','CASH']),
  startDate: z.date({ required_error: 'Kies een startdatum' }),
  endDate: z.date(),
  amount: z.number().min(0.01, 'Bedrag moet groter zijn dan € 0,00'),
  iban: z.string().optional(),
  note: z.string().max(500).optional(),
  autoCreate: z.boolean().default(false),
}).refine(
  (v) => v.term === 'YEARLY' || v.term === 'MONTHLY',
  { message: 'Ongeldige termijn' }
).refine(
  (v) => v.endDate >= v.startDate,
  { message: 'Einddatum moet na startdatum liggen', path: ['endDate'] }
).refine(
  (v) => (v.method !== 'SEPA') || (v.iban && /^([A-Z]{2}\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{0,2})$/.test(v.iban)),
  { message: 'IBAN vereist en ongeldig voor SEPA', path: ['iban'] }
);

export type NewFeeFormData = z.infer<typeof NewFeeSchema>;