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
      <div className="flex flex-col md:flex-row items-start gap-8">
        {/* Left side - Chart */}
        <div className="flex-shrink-0">
          <ConcentricRings categories={categories} size={280} />
        </div>

        {/* Right side - Total + Legend */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Large Total */}
          <div className="text-center md:text-left">
            <div 
              className="text-5xl font-bold font-['Poppins']" 
              style={{ color: '#0F172A' }}
            >
              {new Intl.NumberFormat('nl-BE').format(total)}
            </div>
            <div 
              className="text-sm font-['Poppins'] mt-1" 
              style={{ color: '#64748B' }}
            >
              Totaal leden
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid #E2E8F0' }}></div>

          {/* Legend */}
          <div className="space-y-4">
            {categories.map((category, index) => (
              <div key={category.key} className="flex items-center justify-between" style={{ minHeight: '48px' }}>
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