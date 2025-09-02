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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-green-400 rounded-full filter blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-400 rounded-full filter blur-3xl"></div>
      </div>

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="backdrop-blur-lg bg-white/30 rounded-3xl p-8 shadow-2xl border border-white/20 mx-auto max-w-4xl">
            <h1
              style={{
                fontSize: `${config.title.fontSize}px`,
                fontFamily: config.title.fontFamily,
                color: config.title.color,
                fontWeight: config.title.fontWeight,
                margin: 0
              }}
              className="drop-shadow-sm"
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
                className="drop-shadow-sm"
                data-testid="ledenlijst-subtitle"
              >
                {config.subtitle.text}
              </h2>
            )}
          </div>
        </div>

        {/* Tabel */}
        <div className="max-w-7xl mx-auto">
          <div className="backdrop-blur-lg bg-white/20 rounded-2xl shadow-xl border border-white/30 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-500/10 to-green-500/10 backdrop-blur-sm">
                  <th className="px-6 py-4 text-left font-semibold text-gray-800 border-b border-white/20">
                    Lidnr.
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-800 border-b border-white/20">
                    Naam
                  </th>
                  {config.display.showVotingRights && (
                    <th className="px-4 py-4 text-center font-semibold text-gray-800 border-b border-white/20">
                      Stemrecht
                    </th>
                  )}
                  {monthNames.map((month, index) => (
                    <th
                      key={month}
                      className="px-3 py-4 text-center font-semibold text-gray-800 text-sm border-b border-white/20 min-w-[60px]"
                    >
                      {month}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentMembers.map((member, memberIndex) => (
                  <tr key={member.id} className="hover:bg-white/30 transition-all duration-300 border-b border-white/10">
                    <td className="px-6 py-4 font-mono text-sm text-gray-800">
                      {member.lidnummer}
                    </td>
                    <td className="px-6 py-4 text-gray-800 font-medium">
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
                            className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 ${
                              status === 'betaald' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                              status === 'achterstallig' ? 'bg-gradient-to-br from-red-400 to-red-600' :
                              'bg-gradient-to-br from-gray-300 to-gray-400'
                            }`}
                            title={`${month}: ${status}`}
                          >
                            {getPaymentStatusIcon(status)}
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
            <div className="mt-8 text-center">
              <div className="backdrop-blur-lg bg-white/30 rounded-2xl p-6 shadow-xl border border-white/20 mx-auto max-w-md">
                <div className="flex justify-center items-center gap-3 mb-3">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        i === currentPage ? 'bg-gradient-to-r from-blue-500 to-green-500 scale-125' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-gray-700 font-medium">
                  Pagina {currentPage + 1} van {totalPages} • {filteredMembers.length} leden
                </p>
              </div>
            </div>
          )}

          {/* Legenda */}
          <div className="mt-8 flex justify-center">
            <div className="backdrop-blur-lg bg-white/30 rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center gap-8 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium text-gray-700">Betaald</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                    <X className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium text-gray-700">Achterstallig</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full shadow-lg"></div>
                  <span className="font-medium text-gray-700">Open</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}