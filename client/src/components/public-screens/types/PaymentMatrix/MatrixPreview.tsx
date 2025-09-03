"use client";

import { PaymentMatrixConfig } from "@/lib/mock/public-screens";
import { getPaymentSnapshot, monthShortNl, Cell } from "@/lib/mock/fees-snapshot";
import { PieChart, Pie, ResponsiveContainer, Legend } from "recharts";
import { Check, X, AlertTriangle } from "lucide-react";

interface MatrixPreviewProps {
  config: PaymentMatrixConfig;
}

export function MatrixPreview({ config }: MatrixPreviewProps) {
  const snapshot = getPaymentSnapshot(config.year, {
    categories: config.filters.categories,
    activeOnly: config.filters.activeOnly
  });

  const chartData = [
    { name: 'Betaald', value: snapshot.totals.paid, color: config.colors.paid },
    { name: 'Openstaand', value: snapshot.totals.open, color: config.colors.open },
    { name: 'Vervallen', value: snapshot.totals.overdue, color: config.colors.overdue }
  ];

  const totalPayments = snapshot.totals.paid + snapshot.totals.open + snapshot.totals.overdue;
  const paidPercentage = totalPayments > 0 ? Math.round((snapshot.totals.paid / totalPayments) * 100) : 0;

  const getCellContent = (status: Cell) => {
    switch (status) {
      case 'PAID':
        return <Check className="h-3 w-3 text-white" />;
      case 'OPEN':
        return <X className="h-3 w-3 text-gray-600" />;
      case 'OVERDUE':
        return <AlertTriangle className="h-3 w-3 text-white" />;
      default:
        return null;
    }
  };

  const getCellStyle = (status: Cell) => {
    const baseStyle = {
      width: `${config.layout.columnWidth}px`,
      height: `${config.layout.maxRowHeight}px`,
      minHeight: '32px'
    };

    switch (status) {
      case 'PAID':
        return { ...baseStyle, backgroundColor: config.colors.paid };
      case 'OPEN':
        return { ...baseStyle, backgroundColor: config.colors.open };
      case 'OVERDUE':
        return { ...baseStyle, backgroundColor: config.colors.overdue };
      default:
        return { ...baseStyle, backgroundColor: config.colors.unknown };
    }
  };

  const formatMemberName = (name: string) => {
    if (!config.display.compactLabels) return name;
    
    const parts = name.split(' ');
    if (parts.length < 2) return name;
    
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');
    return `${firstName.charAt(0)}. ${lastName}`;
  };

  return (
    <div className="h-full p-4 bg-white overflow-auto text-sm">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">
              Betaalstatus Matrix {config.year}
            </h1>
            {config.filters.categories.length > 0 && (
              <div className="text-sm text-gray-600">
                Categorieën: {config.filters.categories.join(', ')}
              </div>
            )}
            {config.display.showPercentage && (
              <div className="text-lg font-semibold text-blue-600 mt-1">
                {paidPercentage}% betaald
              </div>
            )}
          </div>

          {config.display.showChart && (
            <div className="w-48 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={20}
                    outerRadius={50}
                    fill="#8884d8"
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={20}
                    iconSize={8}
                    wrapperStyle={{ fontSize: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Matrix */}
      <div className="overflow-auto">
        <table role="table" className="border-collapse">
          <thead>
            <tr>
              <th 
                scope="col" 
                className="sticky left-0 bg-white border border-gray-200 p-2 text-left font-medium text-gray-900 min-w-24"
              >
                Lid
              </th>
              {monthShortNl.map((month, index) => (
                <th 
                  key={index}
                  scope="col"
                  className="border border-gray-200 p-1 text-center font-medium text-gray-900 text-xs"
                  style={{ width: `${config.layout.columnWidth}px` }}
                >
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {snapshot.rows.map((row) => (
              <tr key={row.memberId}>
                <th 
                  scope="row"
                  className="sticky left-0 bg-white border border-gray-200 p-2 font-medium text-gray-900 text-xs"
                  style={{ maxHeight: `${config.layout.maxRowHeight}px` }}
                >
                  <div className="truncate" title={row.name}>
                    {formatMemberName(row.name)}
                  </div>
                </th>
                {Array.from({ length: 12 }, (_, monthIndex) => {
                  const monthNum = monthIndex + 1;
                  const status = row.months[monthNum] || 'NA';
                  return (
                    <td 
                      key={monthNum}
                      className="border border-gray-200 p-0"
                      aria-label={`${row.name}, ${monthShortNl[monthIndex]}: ${status.toLowerCase()}`}
                    >
                      <div 
                        className="flex items-center justify-center"
                        style={getCellStyle(status)}
                      >
                        {getCellContent(status)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Stats */}
      <div className="mt-6 flex gap-6 text-xs text-gray-600">
        <div>Totaal leden: {snapshot.count}</div>
        <div>Betaalde transacties: {snapshot.totals.paid}</div>
        <div>Openstaande transacties: {snapshot.totals.open}</div>
        <div>Vervallen transacties: {snapshot.totals.overdue}</div>
      </div>
    </div>
  );
}