import { UserPlus, UserCheck, CreditCard, AlertCircle } from 'lucide-react';

const activities = [
  {
    id: 1,
    user: 'Emma Janssen',
    action: 'Nieuw lid toegevoegd',
    time: '2 uur geleden',
    icon: UserPlus,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600'
  },
  {
    id: 2,
    user: 'Mohamed Al-Rashid',
    action: 'Lidgeld betaald',
    time: '3 uur geleden',
    icon: CreditCard,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600'
  },
  {
    id: 3,
    user: 'Fatima Bouchouchi',
    action: 'Profiel bijgewerkt',
    time: '5 uur geleden',
    icon: UserCheck,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600'
  },
  {
    id: 4,
    user: 'Ahmed El-Hassani',
    action: 'Status gewijzigd naar actief',
    time: '1 dag geleden',
    icon: UserCheck,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600'
  },
  {
    id: 5,
    user: 'System',
    action: 'Automatische herinnering verzonden',
    time: '2 dagen geleden',
    icon: AlertCircle,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600'
  }
];

export default function RecentActivities() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="mb-6">
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
}