import { z } from "zod";
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";
import type { ParsedTransaction } from "./csv";
import { parsedTransactionSchema } from "./csv";

/**
 * CODA Parser voor Belgische banktransacties
 * 
 * CODA (COmputerised Data) is een Belgisch standaard formaat
 * gebruikt door Belgische banken voor rekeningafschriften.
 */
export class CodaParser {
  
  /**
   * Parse CODA content naar transacties
   */
  parse(codaContent: string): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];
    const lines = codaContent.split('\n').map(line => line.trim());
    
    let currentAccount: string | null = null;
    let statementDate: Date | null = null;
    
    for (const line of lines) {
      if (line.length === 0) continue;
      
      const recordType = line.substring(0, 1);
      
      switch (recordType) {
        case '0': // Header record
          // Extracteer statement informatie indien nodig
          break;
          
        case '1': // Account identification record
          currentAccount = this.parseAccountRecord(line);
          statementDate = this.parseStatementDate(line);
          break;
          
        case '2': // Transaction record
          try {
            const transaction = this.parseTransactionRecord(line, statementDate);
            if (transaction) {
              transactions.push(transaction);
            }
          } catch (error) {
            console.warn('Fout bij verwerken CODA transactie:', error);
          }
          break;
          
        case '3': // Information record
          // Aanvullende informatie voor vorige transactie
          // Kan gebruikt worden voor uitgebreide beschrijvingen
          break;
          
        case '4': // Communication record
          // Communicatie records bevatten vrije tekst
          break;
          
        case '8': // Trailer record - nieuwe saldo
          break;
          
        case '9': // End record
          break;
          
        default:
          console.warn(`Onbekend CODA record type: ${recordType}`);
      }
    }
    
    return transactions;
  }
  
  /**
   * Parse account identification record (type 1)
   */
  private parseAccountRecord(line: string): string {
    // CODA record type 1: account number en datum
    // Positie 5-16: Account number (12 characters)
    return line.substring(4, 16).trim();
  }
  
  /**
   * Parse statement date from account record
   */
  private parseStatementDate(line: string): Date {
    // CODA record type 1: datum in positie 57-62 (DDMMYY)
    try {
      const dateStr = line.substring(57, 63); // DDMMYY
      const day = parseInt(dateStr.substring(0, 2), 10);
      const month = parseInt(dateStr.substring(2, 4), 10);
      const year = 2000 + parseInt(dateStr.substring(4, 6), 10);
      
      return zonedTimeToUtc(new Date(year, month - 1, day), 'Europe/Brussels');
    } catch (error) {
      console.warn('Fout bij parsen CODA datum:', error);
      return new Date();
    }
  }
  
  /**
   * Parse transaction record (type 2)
   */
  private parseTransactionRecord(line: string, statementDate: Date | null): ParsedTransaction | null {
    try {
      // CODA record type 2 structure:
      // Pos 1: Record type (2)
      // Pos 2-7: Reference number
      // Pos 8-13: Bank reference
      // Pos 14-19: Transaction date (DDMMYY)
      // Pos 20-23: Reference
      // Pos 24: Credit/Debit mark (0=debit, 1=credit)
      // Pos 25-39: Amount (15 digits, last 3 are decimals)
      // Pos 40-42: Currency code
      // Pos 43-46: Transaction family
      // Pos 47-50: Operation code
      // Pos 51-113: Communication
      
      if (line.length < 128) {
        throw new Error(`CODA lijn te kort: ${line.length} karakters`);
      }
      
      // Datum extractie
      const dateStr = line.substring(13, 19); // DDMMYY
      const day = parseInt(dateStr.substring(0, 2), 10);
      const month = parseInt(dateStr.substring(2, 4), 10);
      const year = 2000 + parseInt(dateStr.substring(4, 6), 10);
      const bookingDate = zonedTimeToUtc(new Date(year, month - 1, day), 'Europe/Brussels');
      
      // Credit/Debit indicator
      const cdIndicator = line.substring(23, 24);
      const side = cdIndicator === '1' ? 'CREDIT' : 'DEBET';
      
      // Bedrag (positie 24-39, laatste 3 cijfers zijn decimalen)
      const amountStr = line.substring(24, 39);
      const amountCents = parseInt(amountStr, 10);
      
      // Currency
      const currency = line.substring(39, 42).trim() || 'EUR';
      
      // Communicatie/beschrijving
      const communication = line.substring(62, 113).trim();
      
      // Bank referentie
      const bankRef = line.substring(7, 13).trim();
      
      return parsedTransactionSchema.parse({
        bookingDate,
        amount: amountCents,
        currency,
        side: side as 'CREDIT' | 'DEBET',
        description: communication || undefined,
        ref: bankRef || undefined,
        // CODA bevat meestal geen IBAN info in transaction records
        counterparty: this.extractCounterpartyFromCommunication(communication),
      });
    } catch (error) {
      console.warn(`Fout bij parsen CODA transactie record: ${line}`, error);
      return null;
    }
  }
  
  /**
   * Extract counterparty information from communication field
   */
  private extractCounterpartyFromCommunication(communication: string): string | undefined {
    if (!communication || communication.trim().length === 0) {
      return undefined;
    }
    
    // Basis extractie - CODA communication velden kunnen gestructureerd zijn
    // maar dit hangt af van de bank en type transactie
    const trimmed = communication.trim();
    
    // Verwijder veelvoorkomende prefixes
    const cleaned = trimmed
      .replace(/^(OVERSCHRIJVING|STORTING|DOMICILIERING|KAART)/i, '')
      .trim();
    
    return cleaned.length > 0 ? cleaned : undefined;
  }
}

/**
 * Utility functie voor CODA parsing
 */
export function parseCoda(content: string): ParsedTransaction[] {
  const parser = new CodaParser();
  return parser.parse(content);
}