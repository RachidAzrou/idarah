import { generateId } from "./utils";

export interface Member {
  id: string;
  lidnummer: number;
  voornaam: string;
  achternaam: string;
  initialen: string;
  categorie: 'Standaard' | 'Student' | 'Kind' | 'Senior' | 'Gezin';
  stemrecht: boolean;
  actief: boolean;
  betalingen: {
    [year: number]: {
      [month: number]: 'betaald' | 'open' | 'vervallen';
    };
  };
}

// Mock leden data
export const mockMembers: Member[] = [
  {
    id: generateId(),
    lidnummer: 1001,
    voornaam: "Ahmed",
    achternaam: "Hassan",
    initialen: "A.H.",
    categorie: "Standaard",
    stemrecht: true,
    actief: true,
    betalingen: {
      2025: {
        1: 'betaald', 2: 'betaald', 3: 'betaald', 4: 'open', 5: 'open',
        6: 'open', 7: 'open', 8: 'open', 9: 'open', 10: 'open', 11: 'open', 12: 'open'
      }
    }
  },
  {
    id: generateId(),
    lidnummer: 1002,
    voornaam: "Fatima",
    achternaam: "Al-Zahra",
    initialen: "F.A.",
    categorie: "Standaard",
    stemrecht: true,
    actief: true,
    betalingen: {
      2025: {
        1: 'betaald', 2: 'betaald', 3: 'open', 4: 'vervallen', 5: 'vervallen',
        6: 'open', 7: 'open', 8: 'open', 9: 'open', 10: 'open', 11: 'open', 12: 'open'
      }
    }
  },
  {
    id: generateId(),
    lidnummer: 1003,
    voornaam: "Omar",
    achternaam: "Abdallah",
    initialen: "O.A.",
    categorie: "Student",
    stemrecht: false,
    actief: true,
    betalingen: {
      2025: {
        1: 'betaald', 2: 'betaald', 3: 'betaald', 4: 'betaald', 5: 'open',
        6: 'open', 7: 'open', 8: 'open', 9: 'open', 10: 'open', 11: 'open', 12: 'open'
      }
    }
  },
  {
    id: generateId(),
    lidnummer: 1004,
    voornaam: "Aisha",
    achternaam: "Rahman",
    initialen: "A.R.",
    categorie: "Standaard",
    stemrecht: true,
    actief: true,
    betalingen: {
      2025: {
        1: 'betaald', 2: 'betaald', 3: 'betaald', 4: 'betaald', 5: 'betaald',
        6: 'betaald', 7: 'open', 8: 'open', 9: 'open', 10: 'open', 11: 'open', 12: 'open'
      }
    }
  },
  {
    id: generateId(),
    lidnummer: 1005,
    voornaam: "Yusuf",
    achternaam: "Al-Mansouri",
    initialen: "Y.A.",
    categorie: "Student",
    stemrecht: false,
    actief: true,
    betalingen: {
      2025: {
        1: 'betaald', 2: 'open', 3: 'vervallen', 4: 'vervallen', 5: 'vervallen',
        6: 'open', 7: 'open', 8: 'open', 9: 'open', 10: 'open', 11: 'open', 12: 'open'
      }
    }
  },
  {
    id: generateId(),
    lidnummer: 1006,
    voornaam: "Khadija",
    achternaam: "Benali",
    initialen: "K.B.",
    categorie: "Standaard",
    stemrecht: true,
    actief: true,
    betalingen: {
      2025: {
        1: 'betaald', 2: 'betaald', 3: 'betaald', 4: 'betaald', 5: 'betaald',
        6: 'betaald', 7: 'betaald', 8: 'betaald', 9: 'open', 10: 'open', 11: 'open', 12: 'open'
      }
    }
  },
  {
    id: generateId(),
    lidnummer: 1007,
    voornaam: "Mustafa",
    achternaam: "El-Khoury",
    initialen: "M.E.",
    categorie: "Senior",
    stemrecht: true,
    actief: true,
    betalingen: {
      2025: {
        1: 'betaald', 2: 'betaald', 3: 'betaald', 4: 'betaald', 5: 'betaald',
        6: 'betaald', 7: 'betaald', 8: 'betaald', 9: 'betaald', 10: 'betaald', 11: 'open', 12: 'open'
      }
    }
  },
  {
    id: generateId(),
    lidnummer: 1008,
    voornaam: "Layla",
    achternaam: "Habib",
    initialen: "L.H.",
    categorie: "Kind",
    stemrecht: false,
    actief: true,
    betalingen: {
      2025: {
        1: 'betaald', 2: 'betaald', 3: 'open', 4: 'open', 5: 'open',
        6: 'open', 7: 'open', 8: 'open', 9: 'open', 10: 'open', 11: 'open', 12: 'open'
      }
    }
  }
];

export const monthNames = [
  "Jan", "Feb", "Mrt", "Apr", "Mei", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"
];

export function getFilteredMembers(
  members: Member[],
  config: {
    categories: string[];
    useFullNames: boolean;
    useInitials: boolean;
    filterByCategories: boolean;
    showVotingRights: boolean;
    actieveLedenOnly?: boolean;
  }
): Member[] {
  let filtered = [...members];

  if (config.actieveLedenOnly) {
    filtered = filtered.filter(member => member.actief);
  }

  if (config.filterByCategories && config.categories.length > 0) {
    filtered = filtered.filter(member => config.categories.includes(member.categorie));
  }

  return filtered;
}

export function getMemberDisplayName(member: Member, config: { useFullNames: boolean; useInitials: boolean }): string {
  if (config.useFullNames) {
    const fullName = `${member.voornaam} ${member.achternaam}`;
    return config.useInitials ? `${fullName} (${member.initialen})` : fullName;
  }
  return config.useInitials ? member.initialen : `${member.voornaam} ${member.achternaam.charAt(0)}.`;
}