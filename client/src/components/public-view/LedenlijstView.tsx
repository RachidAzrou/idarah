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
    <div className="min-h-screen bg-white p-8">
      {/* Header */}
      <div className="text-center mb-8">
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

      {/* Tabel */}
      <div className="max-w-full overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-3 text-left font-medium">
                Lidnr.
              </th>
              <th className="border border-gray-300 px-4 py-3 text-left font-medium">
                Naam
              </th>
              {config.display.showVotingRights && (
                <th className="border border-gray-300 px-4 py-3 text-center font-medium">
                  Stemrecht
                </th>
              )}
              {monthNames.map((month, index) => (
                <th
                  key={month}
                  className="border border-gray-300 px-2 py-3 text-center font-medium min-w-[60px]"
                >
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentMembers.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-mono text-sm">
                  {member.lidnummer}
                </td>
                <td className="border border-gray-300 px-4 py-3">
                  {getMemberDisplayName(member, {
                    useFullNames: config.display.useFullNames,
                    useInitials: config.display.useInitials
                  })}
                </td>
                {config.display.showVotingRights && (
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    {member.stemrecht && (
                      <Vote className="w-4 h-4 text-blue-600 mx-auto" />
                    )}
                  </td>
                )}
                {monthNames.map((month, monthIndex) => {
                  const monthNumber = monthIndex + 1;
                  const status = member.betalingen[config.year]?.[monthNumber] || 'open';
                  
                  return (
                    <td
                      key={month}
                      className="border border-gray-300 px-2 py-3 text-center"
                    >
                      <div
                        className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center ${getPaymentStatusColor(status)}`}
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
        <div className="mt-6 text-center text-gray-600">
          <div className="flex justify-center items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i === currentPage ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-sm">
            Pagina {currentPage + 1} van {totalPages} • {filteredMembers.length} leden
          </p>
        </div>
      )}

      {/* Legenda */}
      <div className="mt-8 flex justify-center">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
            <span>Betaald</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-300"></div>
            <span>Open</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
              <X className="w-3 h-3 text-white" />
            </div>
            <span>Achterstallig</span>
          </div>
        </div>
      </div>
    </div>
  );
}