import { ChevronRight } from 'lucide-react';
import { BiCalendarExclamation } from 'react-icons/bi';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { differenceInDays, parseISO } from 'date-fns';

export default function DueDates() {
  const { data: fees } = useQuery({
    queryKey: ["/api/fees"],
  });
  
  const dueDates = useMemo(() => {
    if (!Array.isArray(fees)) {
      return [
        {
          id: 1,
          name: 'Geen openstaande facturen',
          category: 'Systeem',
          daysLeft: 0,
          status: 'info'
        }
      ];
    }
    
    const openFees = fees
      .filter((fee: any) => fee.status === 'OPEN' || fee.status === 'OVERDUE')
      .map((fee: any) => {
        const periodEnd = parseISO(fee.periodEnd);
        const today = new Date();
        const daysLeft = differenceInDays(periodEnd, today);
        
        // Map database categories to display categories
        let category = 'Standaard';
        const memberCategory = fee.memberName?.split(' - ')[1]; // Assuming format "Name - Category"
        if (memberCategory === 'STUDENT') category = 'Student';
        else if (memberCategory === 'SENIOR') category = 'Senior';
        else if (memberCategory === 'STANDAARD') category = 'Standaard';
        
        let status = 'upcoming';
        if (daysLeft <= 0) status = 'today';
        else if (daysLeft <= 3) status = 'urgent';
        
        return {
          id: fee.id,
          name: fee.memberName?.split(' - ')[0] || 'Onbekend lid',
          category,
          daysLeft: Math.abs(daysLeft),
          status,
          amount: parseFloat(fee.amount)
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 5); // Toon top 5
    
    return openFees.length > 0 ? openFees : [
      {
        id: 1,
        name: 'Alle facturen zijn bijgewerkt',
        category: 'Systeem',
        daysLeft: 0,
        status: 'success'
      }
    ];
  }, [fees]);
  
  return (
    <div className="glass-card rounded-2xl p-6 card-hover animate-fade-in group">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-300">Aankomende Vervaldagen</h3>
        <p className="text-sm text-muted-foreground">Lidgelden die binnenkort vervallen</p>
      </div>
      
      <div className="space-y-4">
        {dueDates.map((item) => (
          <div key={item.id} className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              item.status === 'today' ? 'bg-red-500' :
              item.status === 'urgent' ? 'bg-orange-50' :
              item.status === 'success' ? 'bg-green-50' :
              'bg-blue-50'
            }`}>
              <BiCalendarExclamation className="h-4 w-4 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {item.name}
              </p>
              <p className="text-sm text-gray-500">
                {item.category}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              {item.status === 'today' ? (
                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                  Vandaag
                </span>
              ) : item.status === 'urgent' ? (
                <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                  {item.daysLeft} {item.daysLeft === 1 ? 'dag' : 'dagen'}
                </span>
              ) : item.status === 'success' ? (
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                  ✓
                </span>
              ) : (
                <span className="text-sm font-medium text-gray-900">
                  {item.daysLeft} {item.daysLeft === 1 ? 'dag' : 'dagen'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}