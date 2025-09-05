"use client";

import { formatCurrencyBE } from "@/lib/format";
import { Euro } from "lucide-react";
import { HiInboxIn } from "react-icons/hi";
import { MdOutlineOutbox } from "react-icons/md";
import { TbClockExclamation, TbAlertTriangle } from "react-icons/tb";
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
  const getColorClasses = () => {
    if (delta.positive) {
      return {
        textClass: 'text-green-600',
        bgClass: 'bg-green-50'
      };
    } else {
      return {
        textClass: 'text-red-500',
        bgClass: 'bg-red-50'
      };
    }
  };

  const colors = getColorClasses();

  return (
    <div className="glass-card rounded-xl p-4 card-hover animate-fade-in group relative overflow-hidden">
      {/* Dynamic gradient overlay based on card type */}
      <div className={`absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
        title === 'Totale Inkomsten' ? 'bg-gradient-to-br from-green-500/5 to-transparent' :
        title === 'Vervallen Lidgeld' ? 'bg-gradient-to-br from-red-500/5 to-transparent' :
        title === 'Openstaand Lidgeld' ? 'bg-gradient-to-br from-orange-500/5 to-transparent' :
        'bg-gradient-to-br from-blue-500/5 to-transparent'
      }`}></div>
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-300 tabular-nums">{value}</p>
          <div className="flex items-center space-x-1">
            <span className={`text-xs font-medium ${colors.textClass} group-hover:text-opacity-80 transition-all duration-300`}>
              {delta.value}
            </span>
          </div>
        </div>
        <div className={`w-10 h-10 ${iconBgColor} rounded-xl flex items-center justify-center shadow-md ring-2 ring-white/10 group-hover:scale-110 transition-all duration-300 relative`}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
          <div className="relative">{icon}</div>
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
    const openFees = Array.isArray(fees) ? fees.filter((f: any) => f.status === 'OPEN').reduce((sum: number, f: any) => sum + parseFloat(f.amount), 0) : 0;
    const overdueFees = Array.isArray(fees) ? fees.filter((f: any) => f.status === 'OVERDUE').reduce((sum: number, f: any) => sum + parseFloat(f.amount), 0) : 0;
    
    return {
      income: totalIncome,
      expense: totalExpense,
      balance,
      openFees,
      overdueFees
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
      title: "Openstaand Lidgeld",
      value: formatCurrencyBE(kpiData.openFees),
      delta: { value: "Openstaande bedragen", positive: false },
      icon: <TbClockExclamation className="h-4 w-4 text-orange-600" />,
      iconBgColor: "bg-orange-50"
    },
    {
      title: "Vervallen Lidgeld",
      value: formatCurrencyBE(kpiData.overdueFees),
      delta: { value: "Vervallen betalingen", positive: false },
      icon: <TbAlertTriangle className="h-4 w-4 text-red-600" />,
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