import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

interface PaymentStatusData {
  name: string;
  value: number;
  color: string;
}

export default function PaymentStatusChart() {
  const { data: fees } = useQuery({
    queryKey: ["/api/fees"],
  });
  
  const data: PaymentStatusData[] = useMemo(() => {
    if (!Array.isArray(fees)) {
      return [
        { name: 'Betaald', value: 0, color: '#16A34A' },
        { name: 'Openstaand', value: 0, color: '#F59E0B' },
        { name: 'Achterstallig', value: 0, color: '#EF4444' },
      ];
    }
    
    const paid = fees.filter((f: any) => f.status === 'PAID').length;
    const open = fees.filter((f: any) => f.status === 'OPEN').length;
    const overdue = fees.filter((f: any) => f.status === 'OVERDUE').length;
    
    return [
      { name: 'Betaald', value: paid, color: '#16A34A' },
      { name: 'Openstaand', value: open, color: '#F59E0B' },
      { name: 'Achterstallig', value: overdue, color: '#EF4444' },
    ];
  }, [fees]);
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
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
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-sm font-medium text-gray-700">{item.name}</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {item.value.toLocaleString('nl-BE')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}