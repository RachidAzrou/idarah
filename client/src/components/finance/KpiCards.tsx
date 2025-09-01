"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyBE } from "@/lib/format";
import { transactions, getTotalByType } from "@/lib/mock/transactions";
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from "lucide-react";
import { useMemo } from "react";

export function KpiCards() {
  const kpiData = useMemo(() => {
    const totalIncome = getTotalByType('INCOME');
    const totalExpense = getTotalByType('EXPENSE');
    const balance = totalIncome - totalExpense;
    
    // Mock achterstallig bedrag (in real app, this would come from overdue fees)
    const overdue = 1450;
    
    return {
      income: totalIncome,
      expense: totalExpense,
      balance,
      overdue
    };
  }, []);

  const kpis = [
    {
      title: "Ontvangen",
      value: kpiData.income,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/10",
      description: "Totale inkomsten"
    },
    {
      title: "Uitgegeven",
      value: kpiData.expense,
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/10",
      description: "Totale uitgaven"
    },
    {
      title: "Saldo",
      value: kpiData.balance,
      icon: DollarSign,
      color: kpiData.balance >= 0 ? "text-green-600" : "text-red-600",
      bgColor: kpiData.balance >= 0 
        ? "bg-green-50 dark:bg-green-900/10" 
        : "bg-red-50 dark:bg-red-900/10",
      description: "Netto resultaat"
    },
    {
      title: "Achterstallig",
      value: kpiData.overdue,
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/10",
      description: "Te betalen lidgeld"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {kpi.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpi.color}`}>
                {formatCurrencyBE(kpi.value)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {kpi.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}