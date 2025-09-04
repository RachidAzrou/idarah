import { z } from "zod";
import { CsvParser, bankConfigs, type CsvConfig } from "./parsers/csv";
import { Mt940Parser } from "./parsers/mt940";
import { CodaParser } from "./parsers/coda";
import type { BankStatement, BankTransaction, InsertBankStatement, InsertBankTransaction } from "../../shared/schema";

// Import validatie schemas
export const importFileSchema = z.object({
  filename: z.string(),
  content: z.string(),
  size: z.number().max(10 * 1024 * 1024), // Max 10MB
  type: z.enum(['CSV', 'MT940', 'CODA']),
});

export const importOptionsSchema = z.object({
  sourceName: z.string().min(1, "Bron naam is verplicht"),
  type: z.enum(['CSV', 'MT940', 'CODA']),
  csvConfig: z.object({
    delimiter: z.string().default(","),
    hasHeader: z.boolean().default(true),
    skipLines: z.number().default(0),
    columns: z.object({
      date: z.number(),
      amount: z.number(),
      description: z.number(),
      counterparty: z.number().optional(),
      iban: z.number().optional(),
      ref: z.number().optional(),
    }),
    bankPreset: z.enum(['KBC', 'ING', 'BNP_PARIBAS_FORTIS', 'CUSTOM']).optional(),
  }).optional(),
});

export type ImportFile = z.infer<typeof importFileSchema>;
export type ImportOptions = z.infer<typeof importOptionsSchema>;

/**
 * Import service voor bankafschriften
 */
export class StatementImportService {
  
  /**
   * Importeer bankafschrift en creëer statement + transacties
   */
  async importStatement(
    file: ImportFile,
    options: ImportOptions,
    tenantId: string,
    userId?: string
  ): Promise<{ statement: BankStatement; transactions: BankTransaction[] }> {
    
    // Valideer input
    const validatedFile = importFileSchema.parse(file);
    const validatedOptions = importOptionsSchema.parse(options);
    
    // Parse transacties op basis van type
    const parsedTransactions = await this.parseTransactions(
      validatedFile.content, 
      validatedOptions
    );
    
    if (parsedTransactions.length === 0) {
      throw new Error('Geen geldige transacties gevonden in het bestand');
    }
    
    // Creëer BankStatement record
    const statementData: InsertBankStatement = {
      tenantId,
      type: validatedOptions.type,
      sourceName: validatedOptions.sourceName,
      importedById: userId,
      numTx: parsedTransactions.length,
      rawFileUrl: null, // TODO: Implementeer file storage
    };
    
    // Hier zou je normaal de database service gebruiken
    // Voor nu returnen we mock data - dit moet geïntegreerd worden met de database service
    const statement: BankStatement = {
      id: 'mock-statement-id',
      ...statementData,
      importedAt: new Date(),
    };
    
    // Converteer parsed transacties naar BankTransaction records
    const bankTransactions: BankTransaction[] = parsedTransactions.map((parsed, index) => ({
      id: `mock-transaction-${index}`,
      tenantId,
      statementId: statement.id,
      bookingDate: parsed.bookingDate,
      valueDate: parsed.valueDate || null,
      side: parsed.side as 'CREDIT' | 'DEBET',
      amount: parsed.amount.toString(), // Decimal als string
      currency: parsed.currency,
      counterparty: parsed.counterparty || null,
      iban: parsed.iban || null,
      description: parsed.description || null,
      ref: parsed.ref || null,
      status: 'ONTVANGEN' as const,
      categoryId: null,
      vendorId: null,
      matchedFeeId: null,
      matchedMemberId: null,
      matchScore: null,
      notes: null,
      createdAt: new Date(),
    }));
    
    return {
      statement,
      transactions: bankTransactions,
    };
  }
  
  /**
   * Parse transacties op basis van bestandstype
   */
  private async parseTransactions(content: string, options: ImportOptions) {
    switch (options.type) {
      case 'CSV':
        return this.parseCsvTransactions(content, options.csvConfig);
        
      case 'MT940':
        const mt940Parser = new Mt940Parser();
        return mt940Parser.parse(content);
        
      case 'CODA':
        const codaParser = new CodaParser();
        return codaParser.parse(content);
        
      default:
        throw new Error(`Onondersteund bestandstype: ${options.type}`);
    }
  }
  
  /**
   * Parse CSV transacties met configuratie
   */
  private parseCsvTransactions(content: string, csvConfig?: ImportOptions['csvConfig']) {
    let config: CsvConfig;
    
    if (csvConfig?.bankPreset && csvConfig.bankPreset !== 'CUSTOM') {
      // Gebruik vooraf gedefinieerde bank configuratie
      const bankConfig = bankConfigs[csvConfig.bankPreset];
      config = {
        ...bankConfig,
        ...csvConfig, // Override met custom settings
        dateFormat: csvConfig.dateFormat || bankConfig.dateFormat || "dd/MM/yyyy",
        decimalSeparator: csvConfig.decimalSeparator || ",",
        thousandsSeparator: csvConfig.thousandsSeparator || ".",
      };
    } else if (csvConfig) {
      // Gebruik volledig custom configuratie
      config = csvConfig as CsvConfig;
    } else {
      // Gebruik standaard configuratie
      config = {
        delimiter: ",",
        hasHeader: true,
        skipLines: 0,
        columns: {
          date: 0,
          amount: 1,
          description: 2,
          counterparty: 3,
          iban: 4,
          ref: 5,
        },
        dateFormat: "dd/MM/yyyy",
        decimalSeparator: ",",
        thousandsSeparator: ".",
      };
    }
    
    const parser = new CsvParser(config);
    return parser.parse(content);
  }
  
  /**
   * Valideer bestand voordat import
   */
  validateFile(file: ImportFile): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      importFileSchema.parse(file);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map(e => e.message));
      } else {
        errors.push('Onbekende validatiefout');
      }
    }
    
    // Aanvullende validaties
    if (file.content.trim().length === 0) {
      errors.push('Bestand is leeg');
    }
    
    if (file.type === 'CSV') {
      const lines = file.content.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        errors.push('CSV bestand moet minimaal 2 lijnen bevatten');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  
  /**
   * Detecteer automatisch bestandstype op basis van content
   */
  detectFileType(content: string): 'CSV' | 'MT940' | 'CODA' | 'UNKNOWN' {
    const trimmed = content.trim();
    
    // CODA detectie - begint met '0' record
    if (trimmed.match(/^0\d{8}/)) {
      return 'CODA';
    }
    
    // MT940 detectie - bevat SWIFT tags
    if (trimmed.includes(':20:') && trimmed.includes(':25:')) {
      return 'MT940';
    }
    
    // CSV detectie - bevat separators en geen SWIFT tags
    if (trimmed.includes(',') || trimmed.includes(';')) {
      return 'CSV';
    }
    
    return 'UNKNOWN';
  }
  
  /**
   * Preview transacties zonder opslaan
   */
  async previewTransactions(
    file: ImportFile, 
    options: ImportOptions
  ): Promise<{ count: number; sample: any[]; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      const parsedTransactions = await this.parseTransactions(file.content, options);
      
      return {
        count: parsedTransactions.length,
        sample: parsedTransactions.slice(0, 5), // Eerste 5 transacties als voorbeeld
        errors,
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Onbekende fout bij preview');
      return {
        count: 0,
        sample: [],
        errors,
      };
    }
  }
}