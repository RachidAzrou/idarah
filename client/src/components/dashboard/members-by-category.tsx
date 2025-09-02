import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';

export default function MembersByCategoryCard() {
  const { data: members } = useQuery({
    queryKey: ["/api/members"],
  });
  
  const { total, categories } = useMemo(() => {
    if (!Array.isArray(members)) {
      return {
        total: 0,
        categories: [
          { key: 'standaard', label: 'Standaard', count: 0, percent: 0, color: '#3B82F6' },
          { key: 'senior', label: 'Senior', count: 0, percent: 0, color: '#1E3A8A' },
          { key: 'student', label: 'Student', count: 0, percent: 0, color: '#06B6D4' },
        ]
      };
    }
    
    const totalMembers = members.length;
    const categoryCounts = members.reduce((acc: any, member: any) => {
      // Map database categories to display categories
      let category = 'Standaard';
      if (member.category === 'STUDENT') category = 'Student';
      else if (member.category === 'SENIOR') category = 'Senior';
      else if (member.category === 'STANDAARD') category = 'Standaard';
      
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    
    const categories = [
      {
        key: 'standaard',
        label: 'Standaard',
        count: categoryCounts['Standaard'] || 0,
        percent: totalMembers > 0 ? Math.round(((categoryCounts['Standaard'] || 0) / totalMembers) * 100) : 0,
        color: '#3B82F6'
      },
      {
        key: 'senior',
        label: 'Senior',
        count: categoryCounts['Senior'] || 0,
        percent: totalMembers > 0 ? Math.round(((categoryCounts['Senior'] || 0) / totalMembers) * 100) : 0,
        color: '#1E3A8A'
      },
      {
        key: 'student',
        label: 'Student',
        count: categoryCounts['Student'] || 0,
        percent: totalMembers > 0 ? Math.round(((categoryCounts['Student'] || 0) / totalMembers) * 100) : 0,
        color: '#06B6D4'
      }
    ];
    
    return { total: totalMembers, categories };
  }, [members]);

  return (
    <div 
      className="bg-white rounded-2xl border border-gray-200 shadow-sm tabindex-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-40"
      style={{ 
        boxShadow: '0 6px 16px rgba(2,6,23,0.08)',
        padding: '24px 28px'
      }}
      tabIndex={0}
    >
      {/* Header */}
      <div className="mb-6 pb-4" style={{ borderBottom: '1px solid #E2E8F0' }}>
        <h3 className="text-lg font-semibold font-['Poppins']" style={{ color: '#0F172A' }}>
          Leden per Categorie
        </h3>
        <p className="text-sm font-['Poppins']" style={{ color: '#64748B' }}>
          Statistieken
        </p>
      </div>

      {/* Content Layout - Horizontal for wider space */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
        {/* Left side - Chart */}
        <div className="flex-shrink-0" style={{ width: '240px', height: '240px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                <linearGradient id="gradient-standaard" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#60A5FA" />
                </linearGradient>
                <linearGradient id="gradient-senior" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1E3A8A" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
                <linearGradient id="gradient-student" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06B6D4" />
                  <stop offset="100%" stopColor="#67E8F9" />
                </linearGradient>
              </defs>
              <Pie
                data={categories.filter(cat => cat.count > 0)}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={0}
                strokeWidth={2}
                stroke="#ffffff"
              >
                {categories.filter(cat => cat.count > 0).map((category, index) => {
                  const getGradientId = (key: string) => {
                    switch (key) {
                      case 'standaard': return 'url(#gradient-standaard)';
                      case 'senior': return 'url(#gradient-senior)';
                      case 'student': return 'url(#gradient-student)';
                      default: return 'url(#gradient-standaard)';
                    }
                  };
                  return (
                    <Cell key={`cell-${index}`} fill={getGradientId(category.key)} />
                  );
                })}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `${value} ${value === 1 ? 'lid' : 'leden'}`,
                  name
                ]}
                labelStyle={{ color: '#0F172A', fontWeight: '600' }}
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontFamily: 'Poppins',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Right side - Total + Legend */}
        <div className="flex-1 space-y-6">
          {/* Large Total - Centered */}
          <div className="text-center">
            <div 
              className="text-4xl font-bold font-['Poppins']" 
              style={{ color: '#0F172A' }}
            >
              {new Intl.NumberFormat('nl-BE').format(total)}
            </div>
            <div 
              className="text-sm font-['Poppins']" 
              style={{ color: '#64748B' }}
            >
              Totaal leden
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid #E2E8F0' }}></div>

          {/* Legend */}
          <div className="space-y-3">
            {categories.map((category, index) => (
              <div key={category.key} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span 
                    className="text-base font-['Poppins']" 
                    style={{ color: '#475569' }}
                  >
                    {category.label}
                  </span>
                </div>
                <div className="text-right">
                  <div 
                    className="text-lg font-semibold font-['Poppins']" 
                    style={{ color: '#0F172A' }}
                  >
                    {new Intl.NumberFormat('nl-BE').format(category.count)}
                  </div>
                  <div 
                    className="text-xs font-['Poppins']" 
                    style={{ color: '#94A3B8' }}
                  >
                    {category.percent}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}