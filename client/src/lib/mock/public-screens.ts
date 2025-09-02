import { generateId } from "./utils";

export type ScreenType = 'LEDENLIJST' | 'MEDEDELINGEN' | 'MULTIMEDIA';

// Styling configuratie voor titel en ondertitel
export interface TitleStyling {
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: 'normal' | 'bold';
}

// Ledenlijst configuratie
export interface LedenlijstConfig {
  description?: string;
  title: TitleStyling;
  subtitle: TitleStyling;
  display: {
    useFullNames: boolean;
    useInitials: boolean;
    filterByCategories: boolean;
    showVotingRights: boolean;
    rowsPerPage: number;
  };
  year: number;
  categories: string[];
}

// Mededelingen configuratie
export interface MededelingenSlide {
  id: string;
  title: string;
  subtitle?: string;
  body?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  validFrom?: string;
  validTo?: string;
  active: boolean;
  durationSec: number;
  styling?: {
    titleFontSize: number;
    titleFontWeight: 'normal' | 'bold' | 'lighter';
    titleFontFamily: string;
    titleColor: string;
    subtitleFontSize: number;
    subtitleFontWeight: 'normal' | 'bold' | 'lighter';
    subtitleFontFamily: string;
    subtitleColor: string;
    bodyFontSize: number;
    bodyFontWeight: 'normal' | 'bold' | 'lighter';
    bodyFontFamily: string;
    bodyColor: string;
    backgroundColor: string;
  };
}

export interface MededelingenConfig {
  description?: string;
  title: TitleStyling;
  subtitle: TitleStyling;
  slides: MededelingenSlide[];
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

// Multimedia configuratie
export interface MultimediaConfig {
  description?: string;
  title: TitleStyling;
  subtitle: TitleStyling;
  mediaItems: {
    id: string;
    url: string;
    type: 'image' | 'video';
    duration: number;
    active: boolean;
  }[];
  autoplay: {
    enabled: boolean;
    interval: number;
  };
}

export interface PublicScreen {
  id: string;
  name: string;
  type: ScreenType;
  active: boolean;
  publicToken: string;
  updatedAt: string;
  config: LedenlijstConfig | MededelingenConfig | MultimediaConfig;
}

// In-memory store
let screens: PublicScreen[] = [
  {
    id: "1",
    name: "Ledenlijst 2025",
    type: "LEDENLIJST",
    active: true,
    publicToken: "ledenlijst-2025-abc123",
    updatedAt: new Date().toISOString(),
    config: {
      description: "Overzicht van alle leden met betaalstatus",
      title: {
        text: "Ledenlijst",
        fontSize: 32,
        fontFamily: "Poppins",
        color: "#1f2937",
        fontWeight: "bold"
      },
      subtitle: {
        text: "Betaalstatus 2025",
        fontSize: 18,
        fontFamily: "Poppins",
        color: "#6b7280",
        fontWeight: "normal"
      },
      display: {
        useFullNames: true,
        useInitials: false,
        filterByCategories: true,
        showVotingRights: false,
        rowsPerPage: 20
      },
      year: 2025,
      categories: ["Standaard", "Student"]
    } as LedenlijstConfig
  },
  {
    id: "2", 
    name: "Algemene Mededelingen",
    type: "MEDEDELINGEN",
    active: false,
    publicToken: "mededelingen-xyz789",
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    config: {
      description: "Belangrijke mededelingen voor de gemeenschap",
      title: {
        text: "Mededelingen",
        fontSize: 28,
        fontFamily: "Poppins",
        color: "#1f2937",
        fontWeight: "bold"
      },
      subtitle: {
        text: "Laatste updates",
        fontSize: 16,
        fontFamily: "Poppins",
        color: "#6b7280",
        fontWeight: "normal"
      },
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
    } as MededelingenConfig
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