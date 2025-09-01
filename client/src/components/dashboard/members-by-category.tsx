import React from 'react';
import { ConcentricRings } from '@/components/charts/concentric-rings';
import { membersByCategory } from '@/lib/mock/members-by-category';

export default function MembersByCategoryCard() {
  const { total, categories } = membersByCategory;

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

      {/* Content Layout */}
      <div className="flex flex-col items-center space-y-4">
        {/* Chart centered and smaller */}
        <div className="flex-shrink-0">
          <ConcentricRings categories={categories} size={200} />
        </div>

        {/* Total below chart */}
        <div className="text-center">
          <div 
            className="text-3xl font-bold font-['Poppins']" 
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

        {/* Legend */}
        <div className="w-full space-y-2">
          {categories.map((category, index) => (
            <div key={category.key} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                ></div>
                <span 
                  className="text-sm font-['Poppins']" 
                  style={{ color: '#475569' }}
                >
                  {category.label}
                </span>
              </div>
              <div className="text-right">
                <div 
                  className="text-sm font-semibold font-['Poppins']" 
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
  );
}