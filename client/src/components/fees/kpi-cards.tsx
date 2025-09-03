import { Fee } from "@shared/fees-schema";
import { formatCurrencyBE, formatPercentage } from "@/lib/format";
import { Check, TrendingUp, TrendingDown, AlertTriangle, FileText } from "lucide-react";
import { TbClockHour3 } from "react-icons/tb";

interface KpiCardProps {
  title: string;
  value: string;
  delta: {
    value: string;
    positive: boolean;
  };
  icon: React.ReactNode;
  iconBgColor: string;
}

function KpiCard({ title, value, delta, icon, iconBgColor }: KpiCardProps) {
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
        <div className={`w-8 h-8 ${iconBgColor} rounded-full flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface KpiCardsProps {
  fees: Fee[];
}

export function KpiCards({ fees }: KpiCardsProps) {
  // Calculate KPIs
  const openFees = fees.filter(fee => fee.status === "OPEN");
  const paidFees = fees.filter(fee => fee.status === "PAID");
  const overdueFees = fees.filter(fee => fee.status === "OVERDUE");
  
  const openAmount = openFees.reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
  const paidAmount = paidFees.reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
  const overdueAmount = overdueFees.reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
  const totalAmount = fees.reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
  
  const paidPercentage = totalAmount > 0 ? (paidAmount / totalAmount) : 0;
  const totalCount = fees.length;

  // Calculate month-over-month changes (mock data for demo)
  const kpiData = [
    {
      title: "Openstaand",
      value: formatCurrencyBE(openAmount),
      delta: { value: `${openFees.length} facturen`, positive: openFees.length < 60 },
      icon: <TbClockHour3 className="h-4 w-4 text-orange-600" />,
      iconBgColor: "bg-orange-50"
    },
    {
      title: "Betaald",
      value: formatPercentage(paidPercentage),
      delta: { value: `${formatCurrencyBE(paidAmount)} ontvangen`, positive: paidPercentage > 65 },
      icon: <Check className="h-4 w-4 text-green-600" />,
      iconBgColor: "bg-green-50"
    },
    {
      title: "Vervallen", 
      value: formatCurrencyBE(overdueAmount),
      delta: { value: `${overdueFees.length} facturen`, positive: overdueFees.length < 60 },
      icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
      iconBgColor: "bg-red-50"
    },
    {
      title: "Totaal Facturen",
      value: totalCount.toString(),
      delta: { value: formatCurrencyBE(totalAmount), positive: true },
      icon: <FileText className="h-4 w-4 text-blue-600" />,
      iconBgColor: "bg-blue-50"
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpiData.map((kpi, index) => (
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