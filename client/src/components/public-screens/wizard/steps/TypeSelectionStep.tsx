"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScreenType } from "@/lib/mock/public-screens";
import { Users, MessageSquare, Video } from "lucide-react";

interface TypeSelectionStepProps {
  data: { type?: ScreenType };
  onUpdate: (data: any) => void;
}

const screenTypes = [
  {
    value: 'LEDENLIJST' as ScreenType,
    label: 'Ledenlijst',
    description: 'Toon leden met betaalstatus per maand',
    icon: Users
  },
  {
    value: 'MEDEDELINGEN' as ScreenType,
    label: 'Mededelingen',
    description: 'Carousel met tekstuele aankondigingen',
    icon: MessageSquare
  },
  {
    value: 'MULTIMEDIA' as ScreenType,
    label: 'Multimedia',
    description: 'Afbeeldingen en video\'s weergeven',
    icon: Video
  }
];

export function TypeSelectionStep({ data, onUpdate }: TypeSelectionStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Kies het type publiek scherm</h3>
        <p className="text-sm text-gray-600">
          Selecteer welk type scherm je wilt aanmaken
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {screenTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = data.type === type.value;
          
          return (
            <div
              key={type.value}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => {
                const baseUpdate = { ...data, type: type.value };
                
                // Initialize settings based on type
                if (type.value === 'MEDEDELINGEN') {
                  onUpdate({
                    ...baseUpdate,
                    mededelingenSettings: {
                      slides: [{
                        id: 'slide1',
                        title: 'Eerste bericht',
                        body: '',
                        active: true,
                        durationSec: 10,
                        styling: {
                          titleFontSize: 32,
                          titleFontWeight: 'bold',
                          titleFontFamily: 'Poppins',
                          titleColor: '#1f2937',
                          bodyFontSize: 18,
                          bodyFontWeight: 'normal',
                          bodyFontFamily: 'Poppins',
                          bodyColor: '#374151',
                          backgroundColor: '#ffffff'
                        }
                      }],
                      autoplay: {
                        enabled: true,
                        interval: 8,
                        order: 'manual'
                      },
                      style: {
                        textColor: '#ffffff',
                        backgroundColor: '#1f2937',
                        maxTextWidth: 800
                      }
                    }
                  });
                } else {
                  onUpdate(baseUpdate);
                }
              }}
              data-testid={`screen-type-${type.value.toLowerCase()}`}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className={`p-3 rounded-full ${
                  isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-medium">{type.label}</h4>
                  <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {data.type && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900">
            {screenTypes.find(t => t.value === data.type)?.label} geselecteerd
          </h4>
          <p className="text-sm text-blue-700 mt-1">
            {screenTypes.find(t => t.value === data.type)?.description}
          </p>
        </div>
      )}
    </div>
  );
}