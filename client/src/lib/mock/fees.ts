import { Fee, FeeStatus, PaymentMethod } from "@shared/fees-schema";
import { addMonths, startOfMonth, endOfMonth, isAfter, format } from "date-fns";

// Mock data generation
export function generateMockFees(): Fee[] {
  const fees: Fee[] = [];
  const startDate = new Date(2023, 0, 1);
  const endDate = new Date(2025, 11, 31);
  
  const members = [
    { id: "1", number: "0001", lastName: "Al-Hassan", firstName: "Ahmed", email: "ahmed.hassan@email.be", phone: "+32 495 12 34 56" },
    { id: "2", number: "0002", lastName: "Ben Omar", firstName: "Fatima", email: "fatima.benomar@email.be", phone: "+32 495 23 45 67" },
    { id: "3", number: "0003", lastName: "El-Mansouri", firstName: "Youssef", email: "youssef.mansouri@email.be", phone: "+32 495 34 56 78" },
    { id: "4", number: "0004", lastName: "Khalil", firstName: "Amina", email: "amina.khalil@email.be", phone: "+32 495 45 67 89" },
    { id: "5", number: "0005", lastName: "Benali", firstName: "Hassan", email: "hassan.benali@email.be", phone: "+32 495 56 78 90" },
    { id: "6", number: "0006", lastName: "Sabri", firstName: "Leila", email: "leila.sabri@email.be", phone: "+32 495 67 89 01" },
    { id: "7", number: "0007", lastName: "Hajji", firstName: "Omar", email: "omar.hajji@email.be", phone: "+32 495 78 90 12" },
    { id: "8", number: "0008", lastName: "Zahra", firstName: "Nadia", email: "nadia.zahra@email.be", phone: "+32 495 89 01 23" },
    { id: "9", number: "0009", lastName: "Karam", firstName: "Ali", email: "ali.karam@email.be", phone: "+32 495 90 12 34" },
    { id: "10", number: "0010", lastName: "Bakr", firstName: "Sara", email: "sara.bakr@email.be", phone: "+32 495 01 23 45" },
  ];
  
  const methods: PaymentMethod[] = ["SEPA", "OVERSCHRIJVING", "BANCONTACT", "CASH"];
  const amounts = [15, 30, 45, 60]; // Monthly amounts in euros
  const categories = ["STUDENT", "VOLWASSEN", "SENIOR"];
  
  let feeId = 1;
  
  // Generate fees for each member for each month in the period
  members.forEach(member => {
    let currentDate = startDate;
    const memberCategory = categories[Math.floor(Math.random() * categories.length)];
    
    while (currentDate <= endDate) {
      const periodStart = startOfMonth(currentDate);
      const periodEnd = endOfMonth(currentDate);
      const dueDate = new Date(periodEnd.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days after period end
      const method = methods[Math.floor(Math.random() * methods.length)];
      const amount = amounts[Math.floor(Math.random() * amounts.length)];
      
      // Determine status based on current date and some randomness
      let status: FeeStatus = "OPEN";
      let paidAt: string | undefined;
      let transactionId: string | undefined;
      let reference: string | undefined;
      
      const now = new Date();
      const isOverdue = isAfter(now, dueDate);
      
      if (Math.random() > 0.3) { // 70% chance of being paid
        status = "PAID";
        const paymentDate = new Date(periodEnd.getTime() + Math.random() * 10 * 24 * 60 * 60 * 1000);
        paidAt = paymentDate.toISOString();
        transactionId = `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        reference = `REF${member.number}${format(periodStart, "yyyyMM")}`;
      } else if (isOverdue && Math.random() > 0.5) {
        status = "OVERDUE";
      }
      
      const notes = Math.random() > 0.8 ? [
        "Automatische incasso gefaald - handmatig opvolgen",
        "Betaling ontvangen via contant tijdens event",
        "Lidgeld voor gastlezingen inbegrepen",
        "Korting toegepast wegens financiële situatie"
      ][Math.floor(Math.random() * 4)] : undefined;
      
      const fee: Fee = {
        id: feeId.toString(),
        memberId: member.id,
        memberNumber: member.number,
        memberLastName: member.lastName,
        memberFirstName: member.firstName,
        memberEmail: member.email,
        memberPhone: member.phone,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        dueDate: dueDate.toISOString(),
        category: memberCategory,
        amount: amount,
        method: method,
        status: status,
        paidAt: paidAt,
        transactionId: transactionId,
        reference: reference,
        notes: notes,
        hasMandate: method === "SEPA" ? Math.random() > 0.2 : false, // 80% have mandate for SEPA
        sepaBatchRef: status === "PAID" && method === "SEPA" && Math.random() > 0.5 ? `SEPA-${format(new Date(paidAt!), "yyyy-MM")}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")}` : undefined,
      };
      
      fees.push(fee);
      feeId++;
      currentDate = addMonths(currentDate, 1);
    }
  });
  
  return fees;
}

// Helper functions
export function filterFees(fees: Fee[], filters: any): Fee[] {
  return fees.filter(fee => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const searchMatch = 
        fee.memberNumber.toLowerCase().includes(searchTerm) ||
        `${fee.memberFirstName} ${fee.memberLastName}`.toLowerCase().includes(searchTerm) ||
        fee.periodStart.includes(searchTerm) ||
        fee.periodEnd.includes(searchTerm);
      if (!searchMatch) return false;
    }
    
    // Status filter
    if (filters.status && filters.status !== "all") {
      if (fee.status !== filters.status) return false;
    }
    
    // Year filter
    if (filters.year && filters.year !== "all") {
      const feeYear = new Date(fee.periodStart).getFullYear().toString();
      if (feeYear !== filters.year) return false;
    }
    
    // Method filter
    if (filters.method && filters.method !== "all") {
      if (fee.method !== filters.method) return false;
    }
    
    // Period filter
    if (filters.periodFrom) {
      if (new Date(fee.periodStart) < new Date(filters.periodFrom)) return false;
    }
    if (filters.periodTo) {
      if (new Date(fee.periodEnd) > new Date(filters.periodTo)) return false;
    }
    
    // Amount filters
    if (filters.amountMin !== undefined && fee.amount < filters.amountMin) return false;
    if (filters.amountMax !== undefined && fee.amount > filters.amountMax) return false;
    
    // Only with mandate
    if (filters.onlyWithMandate && !fee.hasMandate) return false;
    
    // Only overdue
    if (filters.onlyOverdue && fee.status !== "OVERDUE") return false;
    
    return true;
  });
}

export function sortFees(fees: Fee[], sortBy: string, sortOrder: "asc" | "desc"): Fee[] {
  return [...fees].sort((a, b) => {
    let aValue: any = a[sortBy as keyof Fee];
    let bValue: any = b[sortBy as keyof Fee];
    
    // Handle special cases
    if (sortBy === "memberName") {
      aValue = `${a.memberFirstName} ${a.memberLastName}`;
      bValue = `${b.memberFirstName} ${b.memberLastName}`;
    }
    
    if (typeof aValue === "string" && typeof bValue === "string") {
      const result = aValue.localeCompare(bValue);
      return sortOrder === "asc" ? result : -result;
    }
    
    if (typeof aValue === "number" && typeof bValue === "number") {
      const result = aValue - bValue;
      return sortOrder === "asc" ? result : -result;
    }
    
    return 0;
  });
}

export function paginateFees(fees: Fee[], page: number, perPage: number) {
  const start = (page - 1) * perPage;
  const end = start + perPage;
  return {
    data: fees.slice(start, end),
    total: fees.length,
    hasMore: end < fees.length,
  };
}

export function markPaid(fee: Fee, paidDate: string): Fee {
  return {
    ...fee,
    status: "PAID" as FeeStatus,
    paidAt: paidDate,
  };
}

export function generateSepaXml(fees: Fee[], batchRef: string): string {
  const totalAmount = fees.reduce((sum, fee) => sum + fee.amount, 0);
  const numTx = fees.length;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.008.001.02">
  <CstmrDrctDbtInitn>
    <GrpHdr>
      <MsgId>${batchRef}</MsgId>
      <CreDtTm>${new Date().toISOString()}</CreDtTm>
      <NbOfTxs>${numTx}</NbOfTxs>
      <CtrlSum>${totalAmount.toFixed(2)}</CtrlSum>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${batchRef}-001</PmtInfId>
      <PmtMtd>DD</PmtMtd>
      <NbOfTxs>${numTx}</NbOfTxs>
      <CtrlSum>${totalAmount.toFixed(2)}</CtrlSum>
      <!-- Transaction details would go here -->
    </PmtInf>
  </CstmrDrctDbtInitn>
</Document>`;
}

// CSV parsing (mock)
export function parseCsv(csvContent: string): any[] {
  const lines = csvContent.split("\n");
  const headers = lines[0].split(",");
  
  return lines.slice(1).map(line => {
    const values = line.split(",");
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header.trim()] = values[index]?.trim();
    });
    return obj;
  });
}

// MT940 parsing (mock)
export function parseMt940(content: string): any[] {
  // Mock MT940 parser - in reality this would be much more complex
  const transactions = [];
  const lines = content.split("\n");
  
  let currentTransaction: any = {};
  
  for (const line of lines) {
    if (line.startsWith(":61:")) {
      // Transaction line
      const parts = line.split(":");
      currentTransaction = {
        date: new Date().toISOString(),
        amount: parseFloat(parts[2]?.replace(/[^0-9.]/g, "") || "0"),
        description: parts[3] || "",
      };
    } else if (line.startsWith(":86:")) {
      // Additional info
      currentTransaction.description += " " + line.substring(4);
      transactions.push(currentTransaction);
      currentTransaction = {};
    }
  }
  
  return transactions;
}

// Guess matches for imported transactions
export function guessMatches(transactions: any[], fees: Fee[]): any[] {
  return transactions.map(transaction => {
    let bestMatch = null;
    let confidence = "unknown";
    
    // Try to match on member number in description
    const memberNumberMatch = transaction.description?.match(/000\d/);
    if (memberNumberMatch) {
      const memberNumber = memberNumberMatch[0];
      const match = fees.find(fee => 
        fee.memberNumber === memberNumber && 
        fee.status === "OPEN" &&
        Math.abs(fee.amount - transaction.amount) < 0.01
      );
      if (match) {
        bestMatch = match;
        confidence = "certain";
      }
    }
    
    // Try to match on amount and date
    if (!bestMatch) {
      const amountMatches = fees.filter(fee => 
        Math.abs(fee.amount - transaction.amount) < 0.01 && 
        fee.status === "OPEN"
      );
      if (amountMatches.length === 1) {
        bestMatch = amountMatches[0];
        confidence = "possible";
      }
    }
    
    return {
      transaction,
      match: bestMatch,
      confidence,
    };
  });
}