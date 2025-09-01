import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Senior', value: 320, color: '#1E40AF', percentage: 25.7 },
  { name: 'Volwassene', value: 650, color: '#3B82F6', percentage: 52.1 },
  { name: 'Student', value: 420, color: '#93C5FD', percentage: 22.2 },
];

const total = data.reduce((sum, item) => sum + item.value, 0);

export default function MembersByCategoryChart() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Leden per Categorie</h3>
        <p className="text-sm text-gray-500">Statistieken</p>
      </div>
      
      <div className="relative h-48 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-gray-900">{total.toLocaleString('nl-BE')}</div>
          <div className="text-sm text-gray-500">Totaal Leden</div>
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
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">
                {item.value.toLocaleString('nl-BE')}
              </div>
              <div className="text-xs text-gray-500">
                {item.percentage}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}