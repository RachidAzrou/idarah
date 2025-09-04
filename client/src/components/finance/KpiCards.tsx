"use client";

import { formatCurrencyBE } from "@/lib/format";
import { TrendingUp, TrendingDown, Euro } from "lucide-react";
import { HiInboxIn } from "react-icons/hi";
import { MdOutlineOutbox } from "react-icons/md";
import { TbClockExclamation } from "react-icons/tb";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

interface KpiCardProps {
  title: string;
  value: string;
  delta: {
    value: string;
    positive: boolean;
  };
  icon: React.ReactNode;
  iconBgColor?: string;
}

function KpiCard({ title, value, delta, icon, iconBgColor = "bg-blue-50" }: KpiCardProps) {
  return (
    <div className="glass-card rounded-2xl p-6 card-hover animate-fade-in group">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
          <p className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">{value}</p>
          <div className="flex items-center space-x-2">
            {delta.positive ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${delta.positive ? 'text-green-600' : 'text-red-500'}`}>
              {delta.value}
            </span>
          </div>
        </div>
        <div className={`w-12 h-12 ${iconBgColor} rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-white/10 group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function KpiCards() {
  const { data: transactions } = useQuery({
    queryKey: ["/api/transactions"],
  });
  
  const { data: fees } = useQuery({
    queryKey: ["/api/fees"],
  });

  const kpiData = useMemo(() => {
    const totalIncome = Array.isArray(transactions) ? transactions.filter((t: any) => t.type === 'INCOME').reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount)), 0) : 0;
    const totalExpense = Array.isArray(transactions) ? transactions.filter((t: any) => t.type === 'EXPENSE').reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount)), 0) : 0;
    const balance = totalIncome - totalExpense;
    const overdue = Array.isArray(fees) ? fees.filter((f: any) => f.status === 'OPEN').reduce((sum: number, f: any) => sum + parseFloat(f.amount), 0) : 0;
    
    return {
      income: totalIncome,
      expense: totalExpense,
      balance,
      overdue
    };
  }, [transactions, fees]);

  const kpis = [
    {
      title: "Totale Inkomsten",
      value: formatCurrencyBE(kpiData.income),
      delta: { value: "Totaal inkomsten", positive: true },
      icon: <HiInboxIn className="h-4 w-4 text-green-600" />,
      iconBgColor: "bg-green-50"
    },
    {
      title: "Totale Uitgaven",
      value: formatCurrencyBE(kpiData.expense),
      delta: { value: "Totaal uitgaven", positive: false },
      icon: <MdOutlineOutbox className="h-4 w-4 text-red-600" />,
      iconBgColor: "bg-red-50"
    },
    {
      title: "Netto Saldo",
      value: formatCurrencyBE(Math.abs(kpiData.balance)),
      delta: { 
        value: kpiData.balance >= 0 ? "Overschot" : "Tekort", 
        positive: kpiData.balance >= 0 
      },
      icon: <Euro className="h-4 w-4 text-blue-600" />,
      iconBgColor: "bg-blue-50"
    },
    {
      title: "Vervallen Lidgeld",
      value: formatCurrencyBE(kpiData.overdue),
      delta: { value: "Openstaande bedragen", positive: false },
      icon: <TbClockExclamation className="h-4 w-4 text-red-600" />,
      iconBgColor: "bg-red-50"
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
          iconBgColor={kpi.iconBgColor}
        />
      ))}
    </div>
  );
}