import { Calendar, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const dueDates = [
  {
    id: 1,
    name: 'Jan de Vries',
    category: 'Senior',
    daysLeft: 0,
    status: 'today'
  },
  {
    id: 2,
    name: 'Mariam Ouali',
    category: 'Volwassene',
    daysLeft: 2,
    status: 'upcoming'
  },
  {
    id: 3,
    name: 'Hassan Benzema',
    category: 'Student',
    daysLeft: 3,
    status: 'upcoming'
  },
  {
    id: 4,
    name: 'Khadija El-Amrani',
    category: 'Senior',
    daysLeft: 5,
    status: 'upcoming'
  },
  {
    id: 5,
    name: 'Omar Tadlaoui',
    category: 'Volwassene',
    daysLeft: 7,
    status: 'upcoming'
  }
];

export default function DueDates() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Aankomende Vervaldagen</h3>
        <p className="text-sm text-gray-500">Lidgelden die binnenkort vervallen</p>
      </div>
      
      <div className="space-y-4">
        {dueDates.map((item) => (
          <div key={item.id} className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
              <Calendar className="h-4 w-4 text-blue-600" />
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
              ) : (
                <span className="text-sm font-medium text-gray-900">
                  {item.daysLeft} {item.daysLeft === 1 ? 'dag' : 'dagen'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <Button variant="ghost" className="w-full justify-between text-blue-600 hover:text-blue-700 hover:bg-blue-50">
          <span>Bekijk alle vervaldagen</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}