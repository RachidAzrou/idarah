import { z } from "zod";
import { parseISO } from "date-fns";
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";
import type { ParsedTransaction } from "./csv";
import { parsedTransactionSchema } from "./csv";

/**
 * MT940 Parser voor SWIFT banktransacties
 * 
 * MT940 is een SWIFT standard formaat gebruikt door vele banken
 * voor het versturen van rekeningafschriften.
 */
export class Mt940Parser {
  
  /**
   * Parse MT940 content naar transacties
   */
  parse(mt940Content: string): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];
    const lines = mt940Content.split('\n').map(line => line.trim());
    
    let currentTransaction: Partial<ParsedTransaction> = {};
    let statementDate: Date | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith(':20:')) {
        // Transaction Reference Number
        continue;
      }
      
      if (line.startsWith(':25:')) {
        // Account Identification
        continue;
      }
      
      if (line.startsWith(':28C:')) {
        // Statement Number/Sequence Number
        continue;
      }
      
      if (line.startsWith(':60F:') || line.startsWith(':60M:')) {
        // Opening Balance
        statementDate = this.parseStatementDate(line);
        continue;
      }
      
      if (line.startsWith(':61:')) {
        // Statement Line
        if (Object.keys(currentTransaction).length > 0) {
          try {
            const parsed = this.finalizeTransaction(currentTransaction, statementDate);
            if (parsed) {
              transactions.push(parsed);
            }
          } catch (error) {
            console.warn('Fout bij verwerken MT940 transactie:', error);
          }
        }
        
        currentTransaction = this.parseStatementLine(line, statementDate);
      }
      
      if (line.startsWith(':86:')) {
        // Information to Account Owner
        const description = line.substring(4);
        currentTransaction.description = description;
        currentTransaction.ref = this.extractReference(description);
        currentTransaction.counterparty = this.extractCounterparty(description);
      }
      
      if (line.startsWith(':62F:') || line.startsWith(':62M:')) {
        // Closing Balance
        if (Object.keys(currentTransaction).length > 0) {
          try {
            const parsed = this.finalizeTransaction(currentTransaction, statementDate);
            if (parsed) {
              transactions.push(parsed);
            }
          } catch (error) {
            console.warn('Fout bij verwerken laatste MT940 transactie:', error);
          }
        }
        break;
      }
    }
    
    return transactions;
  }
  
  /**
   * Parse statement datum uit opening balance lijn
   */
  private parseStatementDate(line: string): Date {
    // :60F:C211031EUR1234567,89
    // Format: C/D YYMMDD CUR Amount
    const match = line.match(/:60[FM]:([CD])(\d{6})/);
    if (!match) {
      throw new Error(`Ongeldig opening balance formaat: ${line}`);
    }
    
    const dateStr = match[2]; // YYMMDD
    const year = 2000 + parseInt(dateStr.substring(0, 2), 10);
    const month = parseInt(dateStr.substring(2, 4), 10);
    const day = parseInt(dateStr.substring(4, 6), 10);
    
    return zonedTimeToUtc(new Date(year, month - 1, day), 'Europe/Brussels');
  }
  
  /**
   * Parse statement lijn (:61:)
   */
  private parseStatementLine(line: string, statementDate: Date | null): Partial<ParsedTransaction> {
    // :61:2110311031DR1234,56NTRFNONREF//ENDTOENDREF
    // Format: YYMMDD MMDD C/D Amount Transaction Type Customer Reference Bank Reference
    
    try {
      // Basis parsing - dit is een vereenvoudigde implementatie
      const content = line.substring(4); // Remove ':61:'
      
      // Datum extractie (eerste 6 chars)
      const dateStr = content.substring(0, 6);
      const year = 2000 + parseInt(dateStr.substring(0, 2), 10);
      const month = parseInt(dateStr.substring(2, 4), 10);
      const day = parseInt(dateStr.substring(4, 6), 10);
      const bookingDate = zonedTimeToUtc(new Date(year, month - 1, day), 'Europe/Brussels');
      
      // Credit/Debit indicator en bedrag
      const cdMatch = content.match(/([CD])([0-9,]+)/);
      if (!cdMatch) {
        throw new Error(`Kan C/D en bedrag niet vinden in: ${line}`);
      }
      
      const side = cdMatch[1] === 'C' ? 'CREDIT' : 'DEBET';
      const amountStr = cdMatch[2];
      const amount = this.parseAmount(amountStr);
      
      return {
        bookingDate,
        amount,
        currency: 'EUR',
        side: side as 'CREDIT' | 'DEBET',
      };
    } catch (error) {
      console.warn(`Fout bij parsen statement lijn: ${line}`, error);
      return {};
    }
  }
  
  /**
   * Finaliseer transactie object
   */
  private finalizeTransaction(
    transaction: Partial<ParsedTransaction>, 
    fallbackDate: Date | null
  ): ParsedTransaction | null {
    try {
      return parsedTransactionSchema.parse({
        bookingDate: transaction.bookingDate || fallbackDate || new Date(),
        valueDate: transaction.valueDate,
        amount: transaction.amount || 0,
        currency: transaction.currency || 'EUR',
        counterparty: transaction.counterparty,
        iban: transaction.iban,
        description: transaction.description,
        ref: transaction.ref,
        side: transaction.side || 'CREDIT',
      });
    } catch (error) {
      console.warn('Fout bij finaliseren transactie:', error);
      return null;
    }
  }
  
  /**
   * Extract reference from description
   */
  private extractReference(description: string): string | undefined {
    // Zoek naar patronen zoals "REF:" of "REFERENCE:"
    const refMatch = description.match(/(?:REF|REFERENCE|MEDEDELING)[:]\s*([^\s]+)/i);
    return refMatch?.[1];
  }
  
  /**
   * Extract counterparty from description
   */
  private extractCounterparty(description: string): string | undefined {
    // Basis extractie - kan verbeterd worden per bank
    const lines = description.split(/[\/\\]/);
    for (const line of lines) {
      if (line.trim() && !line.match(/^\d+$/) && !line.match(/^[A-Z]{2}\d+/)) {
        return line.trim();
      }
    }
    return undefined;
  }
  
  /**
   * Parse bedrag string naar centen
   */
  private parseAmount(amountStr: string): number {
    try {
      // MT940 gebruikt komma als decimaal separator
      const normalized = amountStr.replace(',', '.');
      const euros = parseFloat(normalized);
      return Math.round(euros * 100);
    } catch (error) {
      throw new Error(`Fout bij parsen bedrag '${amountStr}': ${error}`);
    }
  }
}

/**
 * Utility functie voor MT940 parsing
 */
export function parseMt940(content: string): ParsedTransaction[] {
  const parser = new Mt940Parser();
  return parser.parse(content);
}