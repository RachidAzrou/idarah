import { generateId } from "./utils";

export type ScreenType = 'PAYMENT_MATRIX' | 'ANNOUNCEMENTS';

export interface PaymentMatrixConfig {
  year: number;
  filters: {
    categories: string[];
    activeOnly: boolean;
  };
  display: {
    showChart: boolean;
    compactLabels: boolean;
    showPercentage: boolean;
  };
  colors: {
    paid: string;
    open: string;
    overdue: string;
    unknown: string;
  };
  layout: {
    maxRowHeight: number;
    columnWidth: number;
  };
}

export interface AnnouncementSlide {
  id: string;
  title: string;
  body?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  validFrom?: string;
  validTo?: string;
  active: boolean;
  durationSec: number;
}

export interface AnnouncementsConfig {
  slides: AnnouncementSlide[];
  autoplay: {
    enabled: boolean;
    interval: number;
    order: 'date' | 'manual' | 'shuffle';
  };
  style: {
    textContrast: 'light' | 'dark';
    background: 'white' | 'black' | 'transparent';
    maxTextWidth: number;
  };
}

export interface PublicScreen {
  id: string;
  name: string;
  type: ScreenType;
  active: boolean;
  publicToken: string;
  updatedAt: string;
  config: PaymentMatrixConfig | AnnouncementsConfig;
}

// In-memory store
let screens: PublicScreen[] = [
  {
    id: "1",
    name: "Betaalstatus Overzicht 2025",
    type: "PAYMENT_MATRIX",
    active: true,
    publicToken: "matrix-2025-abc123",
    updatedAt: new Date().toISOString(),
    config: {
      year: 2025,
      filters: {
        categories: ["Volwassene", "Student"],
        activeOnly: true
      },
      display: {
        showChart: true,
        compactLabels: true,
        showPercentage: true
      },
      colors: {
        paid: "#2563EB",
        open: "#DBEAFE", 
        overdue: "#FCA5A5",
        unknown: "#9CA3AF"
      },
      layout: {
        maxRowHeight: 48,
        columnWidth: 48
      }
    } as PaymentMatrixConfig
  },
  {
    id: "2", 
    name: "Algemene Mededelingen",
    type: "ANNOUNCEMENTS",
    active: false,
    publicToken: "announcements-xyz789",
    updatedAt: new Date(Date.now() - 86400000).toISOString(), // yesterday
    config: {
      slides: [
        {
          id: "slide1",
          title: "Welkom bij onze moskee",
          body: "Vrede zij met u. Welkom in ons gemeenschapshuis.",
          active: true,
          durationSec: 10
        }
      ],
      autoplay: {
        enabled: true,
        interval: 8,
        order: "date"
      },
      style: {
        textContrast: "light",
        background: "black",
        maxTextWidth: 800
      }
    } as AnnouncementsConfig
  }
];

export const publicScreensStore = {
  list(): PublicScreen[] {
    return [...screens];
  },

  create(input: Omit<PublicScreen, 'id' | 'publicToken' | 'updatedAt'>): PublicScreen {
    const screen: PublicScreen = {
      ...input,
      id: generateId(),
      publicToken: this.generateToken(),
      updatedAt: new Date().toISOString()
    };
    screens.push(screen);
    return screen;
  },

  update(id: string, patch: Partial<PublicScreen>): PublicScreen {
    const index = screens.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Screen not found');
    
    screens[index] = {
      ...screens[index],
      ...patch,
      updatedAt: new Date().toISOString()
    };
    return screens[index];
  },

  remove(id: string): void {
    screens = screens.filter(s => s.id !== id);
  },

  byToken(token: string): PublicScreen | undefined {
    return screens.find(s => s.publicToken === token);
  },

  generateToken(): string {
    return `screen-${Math.random().toString(36).substring(2, 15)}`;
  }
};