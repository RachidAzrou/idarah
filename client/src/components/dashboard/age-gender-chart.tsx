import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const data = [
  { ageGroup: '<18', male: 45, female: 38, total: 83 },
  { ageGroup: '18-30', male: 120, female: 95, total: 215 },
  { ageGroup: '30-50', male: 180, female: 165, total: 345 },
  { ageGroup: '50-65', male: 145, female: 125, total: 270 },
  { ageGroup: '65+', male: 85, female: 95, total: 180 },
];

export default function AgeGenderChart() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Leeftijd en Geslacht</h3>
        <p className="text-sm text-gray-500">Statistieken</p>
      </div>
      
      <div className="h-64 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="horizontal"
            margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
          >
            <XAxis 
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748B' }}
            />
            <YAxis 
              type="category"
              dataKey="ageGroup"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748B' }}
            />
            <Bar 
              dataKey="male" 
              stackId="gender"
              fill="#2563EB"
              radius={[0, 0, 0, 0]}
            />
            <Bar 
              dataKey="female" 
              stackId="gender"
              fill="#A855F7"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center space-x-6 mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
          <span className="text-sm text-gray-700">Man</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span className="text-sm text-gray-700">Vrouw</span>
        </div>
      </div>

      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">{item.ageGroup}</span>
            <span className="text-gray-900 font-semibold">
              {((item.total / 1247) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}