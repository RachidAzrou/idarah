export interface CSVRow {
  [key: string]: string;
}

export interface CSVParseResult {
  headers: string[];
  rows: CSVRow[];
  success: boolean;
  error?: string;
}

/**
 * Simple CSV parser for import functionality
 */
export function parseCSV(csvContent: string): CSVParseResult {
  try {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      return {
        headers: [],
        rows: [],
        success: false,
        error: 'CSV moet minimaal een header en één rij bevatten'
      };
    }

    // Parse headers
    const headers = lines[0].split(';').map(h => h.trim().replace(/"/g, ''));
    
    // Parse rows
    const rows: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(';').map(v => v.trim().replace(/"/g, ''));
      const row: CSVRow = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      rows.push(row);
    }

    return {
      headers,
      rows,
      success: true
    };
  } catch (error) {
    return {
      headers: [],
      rows: [],
      success: false,
      error: 'Fout bij het parseren van CSV bestand'
    };
  }
}

/**
 * Mock MT940 parser (simplified for demo)
 */
export function parseMT940(content: string): CSVParseResult {
  // Mock implementation - in real app would parse MT940 format
  try {
    const lines = content.split('\n').filter(line => line.trim());
    const rows: CSVRow[] = [];
    
    // Simple mock parsing - extract transaction-like lines
    lines.forEach((line, index) => {
      if (line.includes(':61:') || line.includes(':86:')) {
        rows.push({
          datum: `2025-01-${(index % 28) + 1}`,
          bedrag: (Math.random() * 1000).toFixed(2),
          omschrijving: `MT940 transactie ${index}`,
          type: Math.random() > 0.5 ? 'Credit' : 'Debet'
        });
      }
    });

    return {
      headers: ['datum', 'bedrag', 'omschrijving', 'type'],
      rows,
      success: true
    };
  } catch (error) {
    return {
      headers: [],
      rows: [],
      success: false,
      error: 'Fout bij het parseren van MT940 bestand'
    };
  }
}

/**
 * Mock CODA parser (simplified for demo)
 */
export function parseCODA(content: string): CSVParseResult {
  // Mock implementation - in real app would parse CODA format
  try {
    const lines = content.split('\n').filter(line => line.trim());
    const rows: CSVRow[] = [];
    
    // Simple mock parsing
    lines.forEach((line, index) => {
      if (line.startsWith('21') || line.startsWith('22')) {
        rows.push({
          datum: `2025-01-${(index % 28) + 1}`,
          bedrag: (Math.random() * 1000).toFixed(2),
          omschrijving: `CODA transactie ${index}`,
          type: Math.random() > 0.5 ? 'C' : 'D'
        });
      }
    });

    return {
      headers: ['datum', 'bedrag', 'omschrijving', 'type'],
      rows,
      success: true
    };
  } catch (error) {
    return {
      headers: [],
      rows: [],
      success: false,
      error: 'Fout bij het parseren van CODA bestand'
    };
  }
}

/**
 * Export transactions to CSV
 */
export function exportToCSV(data: any[], filename: string = 'transacties.csv'): void {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(';'),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(';') 
          ? `"${value}"` 
          : value;
      }).join(';')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}