import { z } from "zod";
import { parseISO, format } from "date-fns";
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";

// CSV parser configuratie schema
export const csvConfigSchema = z.object({
  delimiter: z.string().default(","),
  hasHeader: z.boolean().default(true),
  skipLines: z.number().default(0),
  columns: z.object({
    date: z.string().or(z.number()),
    amount: z.string().or(z.number()),
    description: z.string().or(z.number()),
    counterparty: z.string().or(z.number()).optional(),
    iban: z.string().or(z.number()).optional(),
    ref: z.string().or(z.number()).optional(),
  }),
  dateFormat: z.string().default("dd/MM/yyyy"), // Belgisch formaat
  decimalSeparator: z.string().default(","),
  thousandsSeparator: z.string().default("."),
});

export type CsvConfig = z.infer<typeof csvConfigSchema>;

// Parsed transactie schema
export const parsedTransactionSchema = z.object({
  bookingDate: z.date(),
  valueDate: z.date().optional(),
  amount: z.number(), // in centen
  currency: z.string().default("EUR"),
  counterparty: z.string().optional(),
  iban: z.string().optional(),
  description: z.string().optional(),
  ref: z.string().optional(),
  side: z.enum(["CREDIT", "DEBET"]),
});

export type ParsedTransaction = z.infer<typeof parsedTransactionSchema>;

/**
 * Parseert een CSV bestand naar BankTransaction objecten
 */
export class CsvParser {
  private config: CsvConfig;

  constructor(config: Partial<CsvConfig> = {}) {
    this.config = csvConfigSchema.parse(config);
  }

  /**
   * Parse CSV content naar transacties
   */
  parse(csvContent: string): ParsedTransaction[] {
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    // Skip lijnen overslaan
    const dataLines = lines.slice(this.config.skipLines);
    
    // Header overslaan indien aanwezig
    const transactionLines = this.config.hasHeader 
      ? dataLines.slice(1) 
      : dataLines;

    return transactionLines
      .map((line, index) => {
        try {
          return this.parseLine(line);
        } catch (error) {
          console.warn(`Fout bij verwerken lijn ${index + 1}:`, error);
          return null;
        }
      })
      .filter((tx): tx is ParsedTransaction => tx !== null);
  }

  /**
   * Parse een enkele CSV lijn
   */
  private parseLine(line: string): ParsedTransaction {
    const fields = this.splitCsvLine(line);
    
    const dateStr = this.getField(fields, this.config.columns.date);
    const amountStr = this.getField(fields, this.config.columns.amount);
    const description = this.getField(fields, this.config.columns.description);
    const counterparty = this.config.columns.counterparty ? this.getField(fields, this.config.columns.counterparty) : undefined;
    const iban = this.config.columns.iban ? this.getField(fields, this.config.columns.iban) : undefined;
    const ref = this.config.columns.ref ? this.getField(fields, this.config.columns.ref) : undefined;

    // Datum parsing (Europe/Brussels tijdzone)
    const bookingDate = this.parseDate(dateStr);
    
    // Bedrag parsing naar centen
    const amount = this.parseAmount(amountStr);
    
    // Bepaal of het een credit of debet is
    const side = amount >= 0 ? "CREDIT" : "DEBET";

    return parsedTransactionSchema.parse({
      bookingDate,
      amount: Math.abs(amount), // Altijd positief opslaan, side bepaalt richting
      currency: "EUR",
      counterparty: counterparty?.trim() || undefined,
      iban: iban?.trim() || undefined,
      description: description?.trim() || undefined,
      ref: ref?.trim() || undefined,
      side,
    });
  }

  /**
   * Split CSV lijn met respect voor quotes
   */
  private splitCsvLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === this.config.delimiter && !inQuotes) {
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    fields.push(current);
    return fields.map(f => f.replace(/^"|"$/g, '')); // Remove surrounding quotes
  }

  /**
   * Haal veld op basis van kolom index of naam
   */
  private getField(fields: string[], column: string | number): string {
    if (typeof column === 'number') {
      return fields[column] || '';
    }
    // Als het een string is, assumeren we dat het een header naam is
    // Dit zou uitgebreid kunnen worden met header mapping
    throw new Error(`Column mapping by name not implemented: ${column}`);
  }

  /**
   * Parse datum string naar Date object (Europe/Brussels tijdzone)
   */
  private parseDate(dateStr: string): Date {
    try {
      // Vervang Belgische datum separators
      const normalized = dateStr
        .replace(/[\/\-\.]/g, '/') // Normaliseer separators
        .trim();

      // Parse verschillende formaten
      if (normalized.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        // dd/MM/yyyy
        const [day, month, year] = normalized.split('/');
        const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        return zonedTimeToUtc(parseISO(isoDate), 'Europe/Brussels');
      }
      
      if (normalized.match(/^\d{4}\/\d{1,2}\/\d{1,2}$/)) {
        // yyyy/MM/dd
        return zonedTimeToUtc(parseISO(normalized.replace(/\//g, '-')), 'Europe/Brussels');
      }

      throw new Error(`Onbekend datum formaat: ${dateStr}`);
    } catch (error) {
      throw new Error(`Fout bij parsen datum '${dateStr}': ${error}`);
    }
  }

  /**
   * Parse bedrag string naar centen (integer)
   */
  private parseAmount(amountStr: string): number {
    try {
      let normalized = amountStr.trim();
      
      // Verwijder currency symbolen
      normalized = normalized.replace(/[€$£]/g, '');
      
      // Belgische notatie: duizendtal separator is punt, decimaal is komma
      // Voorbeeld: "1.234,56" -> 123456 centen
      if (this.config.decimalSeparator === ',' && this.config.thousandsSeparator === '.') {
        // Splits op komma voor decimalen
        const parts = normalized.split(',');
        
        if (parts.length === 1) {
          // Geen decimalen, verwijder duizendtal separators
          const euros = parseInt(parts[0].replace(/\./g, ''), 10);
          return euros * 100;
        } else if (parts.length === 2) {
          // Decimalen aanwezig
          const euros = parseInt(parts[0].replace(/\./g, ''), 10);
          const cents = parseInt(parts[1].padEnd(2, '0').slice(0, 2), 10);
          return euros * 100 + cents;
        }
      }
      
      // Fallback: standaard JavaScript parsing
      const amount = parseFloat(normalized.replace(/[^\d\.\-]/g, ''));
      return Math.round(amount * 100);
    } catch (error) {
      throw new Error(`Fout bij parsen bedrag '${amountStr}': ${error}`);
    }
  }
}

/**
 * Standaard configuraties voor veelgebruikte banken
 */
export const bankConfigs = {
  KBC: {
    delimiter: ";",
    hasHeader: true,
    columns: {
      date: 2,        // Datum
      amount: 7,      // Bedrag
      description: 8, // Mededeling
      counterparty: 4, // Tegenpartij
      iban: 5,        // Rekening tegenpartij
      ref: 9,         // Referentie
    },
    dateFormat: "dd/MM/yyyy",
  },
  
  ING: {
    delimiter: ",",
    hasHeader: true,
    columns: {
      date: 0,
      amount: 6,
      description: 8,
      counterparty: 2,
      iban: 3,
      ref: 7,
    },
  },
  
  BNP_PARIBAS_FORTIS: {
    delimiter: ";",
    hasHeader: true,
    columns: {
      date: 1,
      amount: 3,
      description: 4,
      counterparty: 5,
      ref: 6,
    },
  },
} as const;