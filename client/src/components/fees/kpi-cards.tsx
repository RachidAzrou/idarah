import { Card, CardContent } from "@/components/ui/card";
import { Fee } from "@shared/fees-schema";
import { formatCurrencyBE, formatPercentage } from "@/lib/format";
import { Euro, TrendingUp, AlertTriangle, FileText, TrendingDown } from "lucide-react";

interface KpiCardsProps {
  fees: Fee[];
}

export function KpiCards({ fees }: KpiCardsProps) {
  // Calculate KPIs
  const openFees = fees.filter(fee => fee.status === "OPEN");
  const paidFees = fees.filter(fee => fee.status === "PAID");
  const overdueFees = fees.filter(fee => fee.status === "OVERDUE");
  
  const openAmount = openFees.reduce((sum, fee) => sum + fee.amount, 0);
  const paidAmount = paidFees.reduce((sum, fee) => sum + fee.amount, 0);
  const overdueAmount = overdueFees.reduce((sum, fee) => sum + fee.amount, 0);
  const totalAmount = fees.reduce((sum, fee) => sum + fee.amount, 0);
  
  const paidPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
  const totalCount = fees.length;

  // Mock trend data (in real app, this would come from historical data comparison)
  const getTrendData = (type: string) => {
    switch (type) {
      case "open":
        return { value: 5.2, isPositive: false }; // Decrease in open amounts is good
      case "paid":
        return { value: 12.3, isPositive: true }; // Increase in paid percentage is good
      case "overdue":
        return { value: 2.1, isPositive: false }; // Increase in overdue is bad
      case "total":
        return { value: 8.7, isPositive: true }; // More total invoices can be positive (growth)
      default:
        return { value: 0, isPositive: true };
    }
  };

  const kpis = [
    {
      title: "Openstaand",
      value: formatCurrencyBE(openAmount),
      icon: Euro,
      description: `${openFees.length} facturen`,
      trend: getTrendData("open"),
    },
    {
      title: "Betaald",
      value: formatPercentage(paidPercentage),
      icon: TrendingUp,
      description: `${formatCurrencyBE(paidAmount)} ontvangen`,
      trend: getTrendData("paid"),
    },
    {
      title: "Achterstallig",
      value: formatCurrencyBE(overdueAmount),
      icon: AlertTriangle,
      description: `${overdueFees.length} facturen`,
      trend: getTrendData("overdue"),
    },
    {
      title: "Totaal facturen",
      value: totalCount.toString(),
      icon: FileText,
      description: formatCurrencyBE(totalAmount),
      trend: getTrendData("total"),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const TrendIcon = kpi.trend.isPositive ? TrendingUp : TrendingDown;
        
        return (
          <Card key={kpi.title} className="relative overflow-hidden border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-blue-500">
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-600">{kpi.title}</span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
                    <div className="text-xs text-gray-500">{kpi.description}</div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    kpi.trend.isPositive 
                      ? 'text-green-700 bg-green-100' 
                      : 'text-red-700 bg-red-100'
                  }`}>
                    <TrendIcon className="h-3 w-3" />
                    {kpi.trend.value}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}