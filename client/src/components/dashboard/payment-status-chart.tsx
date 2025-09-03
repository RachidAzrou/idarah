import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';

interface PaymentStatusData {
  name: string;
  value: number;
  color: string;
}

const PaymentStatusChart = React.memo(function PaymentStatusChart() {
  const { data: fees } = useQuery({
    queryKey: ["/api/fees"],
  });
  
  const data: PaymentStatusData[] = useMemo(() => {
    // Optimized counting with a single pass
    const counts = Array.isArray(fees) && fees.length > 0 
      ? fees.reduce((acc: any, f: any) => {
          if (f.status === 'PAID') acc.paid++;
          else if (f.status === 'OPEN') acc.open++;
          else if (f.status === 'OVERDUE') acc.overdue++;
          return acc;
        }, { paid: 0, open: 0, overdue: 0 })
      : { paid: 0, open: 0, overdue: 0 };
    
    // Als alle waarden 0 zijn, toon een minimale waarde zodat de grafiek zichtbaar is
    const hasData = counts.paid > 0 || counts.open > 0 || counts.overdue > 0;
    
    return [
      { name: 'Betaald', value: hasData ? counts.paid : 1, color: hasData ? '#16A34A' : '#E5E7EB' },
      { name: 'Openstaand', value: hasData ? counts.open : 1, color: hasData ? '#F59E0B' : '#E5E7EB' },
      { name: 'Achterstallig', value: hasData ? counts.overdue : 1, color: hasData ? '#EF4444' : '#E5E7EB' },
    ];
  }, [fees]);
  
  // Bereken het echte totaal (zonder de minimale waarden voor lege grafiek)
  const total = useMemo(() => {
    if (!Array.isArray(fees) || fees.length === 0) return 0;
    return fees.length;
  }, [fees]);
  
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Betalingsstatus</h3>
        <p className="text-sm text-gray-500">Verdeling van betalingen</p>
      </div>
      
      <div className="relative h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="75%"
              startAngle={180}
              endAngle={0}
              innerRadius={80}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ top: '30%' }}>
          <div className="text-2xl font-bold text-gray-900">{total.toLocaleString('nl-BE')}</div>
          <div className="text-sm text-gray-500">Totaal Facturen</div>
        </div>
      </div>

      <div className="space-y-3">
        {data.map((item, index) => {
          // Bereken de echte waarde voor de legenda
          const realValue = useMemo(() => {
            if (!Array.isArray(fees) || fees.length === 0) return 0;
            
            const counts = fees.reduce((acc: any, f: any) => {
              if (f.status === 'PAID') acc.paid++;
              else if (f.status === 'OPEN') acc.open++;
              else if (f.status === 'OVERDUE') acc.overdue++;
              return acc;
            }, { paid: 0, open: 0, overdue: 0 });
            
            if (item.name === 'Betaald') return counts.paid;
            if (item.name === 'Openstaand') return counts.open;
            if (item.name === 'Achterstallig') return counts.overdue;
            return 0;
          }, [fees, item.name]);
          
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm font-medium text-gray-700">{item.name}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {realValue.toLocaleString('nl-BE')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default PaymentStatusChart;