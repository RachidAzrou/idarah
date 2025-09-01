import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Betaald', value: 1058, color: '#2563EB' },
  { name: 'Openstaand', value: 150, color: '#60A5FA' },
  { name: 'Vervallen', value: 39, color: '#EF4444' },
];

const total = data.reduce((sum, item) => sum + item.value, 0);

export default function PaymentStatusChart() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="mb-6">
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