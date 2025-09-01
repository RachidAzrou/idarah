import { z } from 'zod';

export const TransactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE'], {
    required_error: 'Type is verplicht',
    invalid_type_error: 'Selecteer Inkomsten of Uitgaven'
  }),
  date: z.string().min(1, 'Datum is verplicht'),
  category: z.string().min(2, 'Categorie moet minimaal 2 karakters bevatten'),
  amount: z.number({
    required_error: 'Bedrag is verplicht',
    invalid_type_error: 'Bedrag moet een getal zijn'
  }).positive('Bedrag moet groter zijn dan 0'),
  method: z.enum(['SEPA', 'OVERSCHRIJVING', 'BANCONTACT', 'CASH'], {
    required_error: 'Betaalmethode is verplicht'
  }),
  memberId: z.string().optional(),
  memberName: z.string().optional(),
  description: z.string().max(500, 'Omschrijving mag maximaal 500 karakters bevatten').optional()
});

export type TransactionFormData = z.infer<typeof TransactionSchema>;

export const ImportMappingSchema = z.object({
  dateColumn: z.string().min(1, 'Selecteer een datumkolom'),
  amountColumn: z.string().min(1, 'Selecteer een bedragkolom'),
  descriptionColumn: z.string().optional(),
  categoryColumn: z.string().optional()
});

export type ImportMappingData = z.infer<typeof ImportMappingSchema>;

export const FilterSchema = z.object({
  search: z.string().optional(),
  type: z.enum(['ALL', 'INCOME', 'EXPENSE']).optional().default('ALL'),
  category: z.string().optional(),
  method: z.enum(['ALL', 'SEPA', 'OVERSCHRIJVING', 'BANCONTACT', 'CASH']).optional().default('ALL'),
  memberId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  amountMin: z.number().optional(),
  amountMax: z.number().optional()
});

export type FilterData = z.infer<typeof FilterSchema>;