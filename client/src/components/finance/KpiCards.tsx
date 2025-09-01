"use client";

import { formatCurrencyBE } from "@/lib/format";
import { transactions, getTotalByType } from "@/lib/mock/transactions";
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from "lucide-react";
import { useMemo } from "react";

interface KpiCardProps {
  title: string;
  value: string;
  delta: {
    value: string;
    positive: boolean;
  };
  icon: React.ReactNode;
}

function KpiCard({ title, value, delta, icon }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-lg font-bold text-gray-900 mb-1">{value}</p>
          <div className="flex items-center space-x-1">
            {delta.positive ? (
              <TrendingUp className="h-3 w-3 text-blue-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={`text-xs font-medium ${delta.positive ? 'text-blue-600' : 'text-red-500'}`}>
              {delta.value}
            </span>
          </div>
        </div>
        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}

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
      title: "Totale Inkomsten",
      value: formatCurrencyBE(kpiData.income),
      delta: { value: "+12,5% vs vorige maand", positive: true },
      icon: <TrendingUp className="h-4 w-4 text-blue-600" />
    },
    {
      title: "Totale Uitgaven",
      value: formatCurrencyBE(kpiData.expense),
      delta: { value: "+2,3% vs vorige maand", positive: false },
      icon: <TrendingDown className="h-4 w-4 text-blue-600" />
    },
    {
      title: "Netto Saldo",
      value: formatCurrencyBE(Math.abs(kpiData.balance)),
      delta: { 
        value: kpiData.balance >= 0 ? "Overschot" : "Tekort", 
        positive: kpiData.balance >= 0 
      },
      icon: <DollarSign className="h-4 w-4 text-blue-600" />
    },
    {
      title: "Achterstallig Lidgeld",
      value: formatCurrencyBE(kpiData.overdue),
      delta: { value: "-8% vs vorige maand", positive: true },
      icon: <AlertTriangle className="h-4 w-4 text-blue-600" />
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi, index) => (
        <KpiCard
          key={index}
          title={kpi.title}
          value={kpi.value}
          delta={kpi.delta}
          icon={kpi.icon}
        />
      ))}
    </div>
  );
}