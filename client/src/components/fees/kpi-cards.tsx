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
  // Bepaal kleuren op basis van kaarttype 
  const getColorClasses = () => {
    if (title === "Betaald") {
      return {
        iconClass: "text-green-600",
        textClass: "text-green-600"
      };
    } else if (title === "Vervallen") {
      return {
        iconClass: "text-red-500",
        textClass: "text-red-500"
      };
    } else if (title === "Openstaand") {
      return {
        iconClass: "text-orange-600",
        textClass: "text-orange-600"
      };
    } else {
      // Voor andere kaarten gebruik de bestaande logica
      return {
        iconClass: delta.positive ? "text-blue-600" : "text-red-500",
        textClass: delta.positive ? "text-blue-600" : "text-red-500"
      };
    }
  };

  const colors = getColorClasses();

  return (
    <div className="glass-card rounded-xl p-4 card-hover animate-fade-in group relative overflow-hidden">
      {/* Dynamic gradient overlay based on card type */}
      <div className={`absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
        title === 'Betaald' ? 'bg-gradient-to-br from-green-500/5 to-transparent' :
        title === 'Vervallen' ? 'bg-gradient-to-br from-red-500/5 to-transparent' :
        title === 'Openstaand' ? 'bg-gradient-to-br from-orange-500/5 to-transparent' :
        'bg-gradient-to-br from-blue-500/5 to-transparent'
      }`}></div>
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-300 tabular-nums">{value}</p>
          <div className="flex items-center space-x-1">
            {delta.positive ? (
              <TrendingUp className={`h-3 w-3 ${colors.iconClass} group-hover:scale-110 transition-transform duration-300`} />
            ) : (
              <TrendingDown className={`h-3 w-3 ${colors.iconClass} group-hover:scale-110 transition-transform duration-300`} />
            )}
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