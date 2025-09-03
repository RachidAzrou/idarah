"use client";

import React, { useState, useEffect } from "react";
// Removed specific config import for now
interface PaymentMatrixConfig {
  year: number;
  filters: {
    categories: string[];
    activeOnly: boolean;
  };
  colors: {
    paid: string;
    open: string;
    overdue: string;
    unknown: string;
  };
  layout: {
    columnWidth: number;
    maxRowHeight: number;
  };
  display: {
    showLegend: boolean;
    showStats: boolean;
  };
}
import { getPaymentSnapshot, monthShortNl, Cell } from "@/lib/mock/fees-snapshot";
import { PieChart, Pie, ResponsiveContainer, Legend } from "recharts";
import { Check, X, AlertTriangle } from "lucide-react";
import { SyncClient } from "./SyncClient";

interface PaymentMatrixViewProps {
  config: PaymentMatrixConfig;
}

const PaymentMatrixView = React.memo(function PaymentMatrixView({ config }: PaymentMatrixViewProps) {
  const [snapshot, setSnapshot] = useState(() => 
    getPaymentSnapshot(config.year, {
      categories: config.filters.categories,
      activeOnly: config.filters.activeOnly
    })
  );

  // Auto-sync every 30 seconds (reduced for better performance)
  useEffect(() => {
    const interval = setInterval(() => {
      const newSnapshot = getPaymentSnapshot(config.year, {
        categories: config.filters.categories,
        activeOnly: config.filters.activeOnly
      });
      setSnapshot(newSnapshot);
    }, 30000);

    return () => clearInterval(interval);
  }, [config]);

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
        return <Check className="h-4 w-4 text-white" />;
      case 'OPEN':
        return <X className="h-4 w-4 text-gray-600" />;
      case 'OVERDUE':
        return <AlertTriangle className="h-4 w-4 text-white" />;
      default:
        return null;
    }
  };

  const getCellStyle = (status: Cell) => {
    const baseStyle = {
      width: `${config.layout.columnWidth}px`,
      height: `${config.layout.maxRowHeight}px`,
      minHeight: '40px'
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
    <div className="min-h-screen bg-white p-8 overflow-auto">
      <SyncClient />
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Betaalstatus Matrix {config.year}
            </h1>
            {config.filters.categories.length > 0 && (
              <div className="text-lg text-gray-600 mb-2">
                Categorieën: {config.filters.categories.join(', ')}
              </div>
            )}
            {config.display.showPercentage && (
              <div className="text-2xl font-semibold text-blue-600">
                {paidPercentage}% betaald
              </div>
            )}
          </div>

          {config.display.showChart && (
            <div className="w-80 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    fill="#8884d8"
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconSize={12}
                    wrapperStyle={{ fontSize: '14px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Matrix */}
      <div className="overflow-auto">
        <table role="table" className="border-collapse w-full">
          <thead>
            <tr>
              <th 
                scope="col" 
                className="sticky left-0 bg-white border-2 border-gray-300 p-4 text-left font-bold text-gray-900 text-lg min-w-48"
              >
                Lid
              </th>
              {monthShortNl.map((month, index) => (
                <th 
                  key={index}
                  scope="col"
                  className="border-2 border-gray-300 p-2 text-center font-bold text-gray-900"
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
                  className="sticky left-0 bg-white border-2 border-gray-300 p-4 font-semibold text-gray-900"
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
                      className="border-2 border-gray-300 p-0"
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
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{snapshot.count}</div>
          <div className="text-sm text-gray-600">Totaal leden</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{snapshot.totals.paid}</div>
          <div className="text-sm text-gray-600">Betaald</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{snapshot.totals.open}</div>
          <div className="text-sm text-gray-600">Openstaand</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{snapshot.totals.overdue}</div>
          <div className="text-sm text-gray-600">Vervallen</div>
        </div>
      </div>
    </div>
  );
});

export { PaymentMatrixView };