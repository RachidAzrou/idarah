import { describe, it, expect, beforeEach } from 'vitest';
import { CsvParser, bankConfigs } from '../parsers/csv';

describe('CsvParser', () => {
  let parser: CsvParser;

  beforeEach(() => {
    parser = new CsvParser();
  });

  describe('Basic CSV parsing', () => {
    it('should parse a simple CSV with header', () => {
      const csvContent = `Datum,Bedrag,Beschrijving,Tegenpartij,IBAN,Referentie
01/01/2024,123.45,"Lidgeld Jan Janssen","Jan Janssen","BE12345678901234567890","REF123"
02/01/2024,-45.67,"Elektriciteit EANDIS","EANDIS","BE98765432109876543210","INVOICE456"`;

      const transactions = parser.parse(csvContent);
      
      expect(transactions).toHaveLength(2);
      
      // Eerste transactie (credit)
      expect(transactions[0]).toMatchObject({
        amount: 12345, // in centen
        side: 'CREDIT',
        currency: 'EUR',
        counterparty: 'Jan Janssen',
        iban: 'BE12345678901234567890',
        description: 'Lidgeld Jan Janssen',
        ref: 'REF123',
      });
      
      // Tweede transactie (debet)
      expect(transactions[1]).toMatchObject({
        amount: 4567, // in centen (altijd positief)
        side: 'DEBET',
        currency: 'EUR',
        counterparty: 'EANDIS',
        iban: 'BE98765432109876543210',
        description: 'Elektriciteit EANDIS',
        ref: 'INVOICE456',
      });
    });

    it('should handle CSV without optional fields', () => {
      const csvContent = `Datum,Bedrag,Beschrijving
01/01/2024,100.00,"Test transactie"`;

      const transactions = parser.parse(csvContent);
      
      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toMatchObject({
        amount: 10000,
        side: 'CREDIT',
        description: 'Test transactie',
        counterparty: undefined,
        iban: undefined,
        ref: undefined,
      });
    });

    it('should handle Belgian number format (comma decimal, dot thousands)', () => {
      const csvContent = `Datum,Bedrag,Beschrijving
01/01/2024,"1.234,56","Groot bedrag"
02/01/2024,"€ 45,67","Met euro symbool"
03/01/2024,-789,01,"Negatief bedrag"`;

      const transactions = parser.parse(csvContent);
      
      expect(transactions).toHaveLength(3);
      expect(transactions[0].amount).toBe(123456); // 1.234,56 -> 123456 centen
      expect(transactions[1].amount).toBe(4567);   // 45,67 -> 4567 centen
      expect(transactions[2].amount).toBe(78901);  // 789,01 -> 78901 centen
    });

    it('should parse various date formats', () => {
      const csvContent = `Datum,Bedrag,Beschrijving
01/01/2024,100,"Date format 1"
1/1/2024,200,"Date format 2"
01-01-2024,300,"Date format 3"`;

      const transactions = parser.parse(csvContent);
      
      expect(transactions).toHaveLength(3);
      
      // Alle transacties moeten een geldige datum hebben
      transactions.forEach(tx => {
        expect(tx.bookingDate).toBeInstanceOf(Date);
        expect(tx.bookingDate.getFullYear()).toBe(2024);
        expect(tx.bookingDate.getMonth()).toBe(0); // Januari (0-indexed)
        expect(tx.bookingDate.getDate()).toBe(1);
      });
    });
  });

  describe('Bank-specific configurations', () => {
    it('should use KBC configuration correctly', () => {
      const kbcParser = new CsvParser(bankConfigs.KBC);
      
      // Mock KBC CSV formaat (semicolon separated)
      const csvContent = `Header;Line;Datum;Tegenpartij;IBAN;Extra;Extra2;Bedrag;Mededeling;Referentie
1;2;01/01/2024;Jan Janssen;BE12345678901234567890;X;Y;123,45;Lidgeld betaling;REF123`;

      const transactions = kbcParser.parse(csvContent);
      
      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toMatchObject({
        amount: 12345,
        side: 'CREDIT',
        counterparty: 'Jan Janssen',
        iban: 'BE12345678901234567890',
        description: 'Lidgeld betaling',
        ref: 'REF123',
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty CSV', () => {
      const transactions = parser.parse('');
      expect(transactions).toHaveLength(0);
    });

    it('should handle CSV with only header', () => {
      const csvContent = 'Datum,Bedrag,Beschrijving';
      const transactions = parser.parse(csvContent);
      expect(transactions).toHaveLength(0);
    });

    it('should skip invalid lines and continue parsing', () => {
      const csvContent = `Datum,Bedrag,Beschrijving
01/01/2024,100,"Valid transaction"
invalid,line,here
02/01/2024,200,"Another valid transaction"`;

      const transactions = parser.parse(csvContent);
      
      // Should parse the valid transactions and skip the invalid one
      expect(transactions).toHaveLength(2);
      expect(transactions[0].amount).toBe(10000);
      expect(transactions[1].amount).toBe(20000);
    });

    it('should handle quoted fields with commas', () => {
      const csvContent = `Datum,Bedrag,Beschrijving
01/01/2024,100,"Description with, comma"
02/01/2024,200,"Another, description, with commas"`;

      const transactions = parser.parse(csvContent);
      
      expect(transactions).toHaveLength(2);
      expect(transactions[0].description).toBe('Description with, comma');
      expect(transactions[1].description).toBe('Another, description, with commas');
    });

    it('should handle amount parsing edge cases', () => {
      const csvContent = `Datum,Bedrag,Beschrijving
01/01/2024,0,"Zero amount"
02/01/2024,0.01,"Minimum amount"
03/01/2024,-0.01,"Negative minimum"`;

      const transactions = parser.parse(csvContent);
      
      expect(transactions).toHaveLength(3);
      expect(transactions[0].amount).toBe(0);
      expect(transactions[0].side).toBe('CREDIT'); // 0 wordt als credit behandeld
      expect(transactions[1].amount).toBe(1);
      expect(transactions[1].side).toBe('CREDIT');
      expect(transactions[2].amount).toBe(1);
      expect(transactions[2].side).toBe('DEBET');
    });
  });

  describe('Configuration validation', () => {
    it('should use default configuration when none provided', () => {
      const defaultParser = new CsvParser();
      // Test that it uses sensible defaults
      expect(defaultParser).toBeDefined();
    });

    it('should merge provided config with defaults', () => {
      const customParser = new CsvParser({
        delimiter: ';',
        hasHeader: false,
      });
      
      // Should use custom delimiter but default other settings
      expect(customParser).toBeDefined();
    });
  });
});