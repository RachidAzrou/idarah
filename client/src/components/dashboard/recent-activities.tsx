import React, { useMemo } from 'react';
import { UserPlus, CreditCard } from 'lucide-react';
import { LuUserCog } from 'react-icons/lu';
import { RiSettings4Line } from 'react-icons/ri';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

const RecentActivities = React.memo(function RecentActivities() {
  const { data: transactions } = useQuery({
    queryKey: ["/api/transactions"],
  });
  
  const activities = useMemo(() => {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return [
        {
          id: 1,
          user: 'Systeem',
          action: 'Geen recente activiteiten',
          time: 'Nu',
          icon: RiSettings4Line,
          iconBg: 'bg-gray-50',
          iconColor: 'text-gray-600'
        }
      ];
    }
    
    // Optimized: take only first 5 and avoid unnecessary operations
    return transactions.slice(0, 5).map((t: any, index: number) => ({
      id: index + 1,
      user: t.memberName || 'Onbekend lid',
      action: t.type === 'INCOME' ? 'Betaling ontvangen' : 'Uitgave geregistreerd',
      time: formatDistanceToNow(new Date(t.date), { addSuffix: true, locale: nl }),
      icon: t.type === 'INCOME' ? CreditCard : UserPlus,
      iconBg: t.type === 'INCOME' ? 'bg-green-50' : 'bg-red-50',
      iconColor: t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
    }));
  }, [transactions]);
  
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recente Activiteiten</h3>
        <p className="text-sm text-gray-500">Laatste wijzigingen en acties</p>
      </div>
      
      <div className="space-y-4">
        {activities.map((activity) => {
          const IconComponent = activity.icon;
          return (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`w-8 h-8 ${activity.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
                <IconComponent className={`h-4 w-4 ${activity.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {activity.user}
                </p>
                <p className="text-sm text-gray-500">
                  {activity.action}
                </p>
              </div>
              <div className="text-xs text-gray-400 flex-shrink-0">
                {activity.time}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default RecentActivities;