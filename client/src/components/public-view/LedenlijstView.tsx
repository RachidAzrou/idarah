"use client";

import { useState, useEffect } from "react";
import { LedenlijstConfig } from "@/lib/mock/public-screens";
import { mockMembers, monthNames, getFilteredMembers, getMemberDisplayName, Member } from "@/lib/mock/members-data";
import { Check, X, Vote } from "lucide-react";

interface LedenlijstViewProps {
  config: LedenlijstConfig;
}

export function LedenlijstView({ config }: LedenlijstViewProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);

  useEffect(() => {
    const filtered = getFilteredMembers(mockMembers, {
      categories: config.categories,
      useFullNames: config.display.useFullNames,
      useInitials: config.display.useInitials,
      filterByCategories: config.display.filterByCategories,
      showVotingRights: config.display.showVotingRights,
      actieveLedenOnly: true
    });
    setFilteredMembers(filtered);
    setCurrentPage(0);
  }, [config]);

  const totalPages = Math.ceil(filteredMembers.length / config.display.rowsPerPage);
  const startIndex = currentPage * config.display.rowsPerPage;
  const endIndex = startIndex + config.display.rowsPerPage;
  const currentMembers = filteredMembers.slice(startIndex, endIndex);

  // Auto-advance pages
  useEffect(() => {
    if (totalPages <= 1) return;

    const interval = setInterval(() => {
      setCurrentPage(prev => (prev + 1) % totalPages);
    }, 15000); // 15 seconden per pagina

    return () => clearInterval(interval);
  }, [totalPages]);

  const getPaymentStatusIcon = (status: 'betaald' | 'open' | 'achterstallig') => {
    switch (status) {
      case 'betaald':
        return <Check className="w-4 h-4 text-white" />;
      case 'achterstallig':
        return <X className="w-4 h-4 text-white" />;
      default:
        return null;
    }
  };

  const getPaymentStatusColor = (status: 'betaald' | 'open' | 'achterstallig') => {
    switch (status) {
      case 'betaald':
        return 'bg-green-500';
      case 'achterstallig':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mx-auto max-w-4xl">
          <h1
            style={{
              fontSize: `${config.title.fontSize}px`,
              fontFamily: config.title.fontFamily,
              color: config.title.color,
              fontWeight: config.title.fontWeight,
              margin: 0
            }}
            data-testid="ledenlijst-title"
          >
            {config.title.text}
          </h1>
          
          {config.subtitle.text && (
            <h2
              style={{
                fontSize: `${config.subtitle.fontSize}px`,
                fontFamily: config.subtitle.fontFamily,
                color: config.subtitle.color,
                fontWeight: config.subtitle.fontWeight,
                margin: '8px 0 0 0'
              }}
              data-testid="ledenlijst-subtitle"
            >
              {config.subtitle.text}
            </h2>
          )}
        </div>
      </div>

      {/* Tabel */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Lidnr.
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Naam
                </th>
                {config.display.showVotingRights && (
                  <th className="px-4 py-4 text-center font-semibold text-gray-700">
                    Stemrecht
                  </th>
                )}
                {monthNames.map((month, index) => (
                  <th
                    key={month}
                    className="px-3 py-4 text-center font-semibold text-gray-700 text-sm min-w-[60px]"
                  >
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentMembers.map((member, memberIndex) => (
                <tr key={member.id} className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                  <td className="px-6 py-4 font-mono text-sm text-gray-600">
                    {member.lidnummer}
                  </td>
                  <td className="px-6 py-4 text-gray-900 font-medium">
                    {getMemberDisplayName(member, {
                      useFullNames: config.display.useFullNames,
                      useInitials: config.display.useInitials
                    })}
                  </td>
                  {config.display.showVotingRights && (
                    <td className="px-4 py-4 text-center">
                      {member.stemrecht && (
                        <Vote className="w-5 h-5 text-blue-600 mx-auto" />
                      )}
                    </td>
                  )}
                  {monthNames.map((month, monthIndex) => {
                    const monthNumber = monthIndex + 1;
                    const status = member.betalingen[config.year]?.[monthNumber] || 'open';
                    
                    return (
                      <td
                        key={month}
                        className="px-3 py-4 text-center"
                      >
                        <div
                          className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center ${
                            status === 'betaald' ? 'bg-green-100' :
                            status === 'achterstallig' ? 'bg-red-100' :
                            'bg-gray-100'
                          }`}
                          title={`${month}: ${status}`}
                        >
                          {status === 'betaald' && (
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          )}
                          {status === 'achterstallig' && (
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginering info */}
        {totalPages > 1 && (
          <div className="mt-6 text-center">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mx-auto max-w-md">
              <div className="flex justify-center items-center gap-2 mb-2">
                {Array.from({ length: totalPages }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i === currentPage ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-gray-600 text-sm">
                Pagina {currentPage + 1} van {totalPages} • {filteredMembers.length} leden
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}