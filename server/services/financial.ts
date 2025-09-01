import { storage } from "../storage";

interface FinancialReports {
  monthlyRevenue: { month: string; amount: number }[];
  paymentStatus: { status: string; count: number; amount: number }[];
  categoryBreakdown: { category: string; amount: number }[];
}

class FinancialService {
  async generateReports(tenantId: string): Promise<FinancialReports> {
    try {
      const transactions = await storage.getTransactionsByTenant(tenantId);
      const fees = await storage.getMembershipFeesByTenant(tenantId);

      // Monthly revenue for the last 12 months
      const monthlyRevenue = this.calculateMonthlyRevenue(transactions);

      // Payment status breakdown
      const paymentStatus = this.calculatePaymentStatus(fees);

      // Category breakdown
      const categoryBreakdown = this.calculateCategoryBreakdown(transactions);

      return {
        monthlyRevenue,
        paymentStatus,
        categoryBreakdown,
      };
    } catch (error) {
      console.error("Error generating financial reports:", error);
      throw error;
    }
  }

  private calculateMonthlyRevenue(transactions: any[]): { month: string; amount: number }[] {
    const monthlyData: { [key: string]: number } = {};
    
    transactions
      .filter(t => t.type === 'INCOME')
      .forEach(transaction => {
        const month = new Date(transaction.date).toISOString().slice(0, 7); // YYYY-MM
        monthlyData[month] = (monthlyData[month] || 0) + parseFloat(transaction.amount);
      });

    return Object.entries(monthlyData)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months
  }

  private calculatePaymentStatus(fees: any[]): { status: string; count: number; amount: number }[] {
    const statusData: { [key: string]: { count: number; amount: number } } = {};

    fees.forEach(fee => {
      const status = fee.status;
      if (!statusData[status]) {
        statusData[status] = { count: 0, amount: 0 };
      }
      statusData[status].count++;
      statusData[status].amount += parseFloat(fee.amount);
    });

    return Object.entries(statusData).map(([status, data]) => ({
      status,
      count: data.count,
      amount: data.amount,
    }));
  }

  private calculateCategoryBreakdown(transactions: any[]): { category: string; amount: number }[] {
    const categoryData: { [key: string]: number } = {};

    transactions.forEach(transaction => {
      const category = transaction.category;
      categoryData[category] = (categoryData[category] || 0) + parseFloat(transaction.amount);
    });

    return Object.entries(categoryData).map(([category, amount]) => ({
      category,
      amount,
    }));
  }
}

export const financialService = new FinancialService();
