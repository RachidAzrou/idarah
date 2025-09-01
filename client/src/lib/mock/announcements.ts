export interface Slide {
  id: string;
  title: string;
  body?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  validFrom?: string;
  validTo?: string;
  active: boolean;
  durationSec?: number;
}

const mockSlides: Slide[] = [
  {
    id: "slide1",
    title: "Ramadan Mubarak",
    body: "Wensen jullie allemaal een gezegend Ramadan. Moge Allah jullie gebeden en goede daden aanvaarden.",
    active: true,
    durationSec: 12,
    validFrom: "2025-03-01T00:00:00Z",
    validTo: "2025-04-30T23:59:59Z"
  },
  {
    id: "slide2", 
    title: "Vrijdaggebed",
    body: "Elke vrijdag om 13:00 uur. Kom op tijd voor een plaats vooraan.",
    active: true,
    durationSec: 8,
    validFrom: "2025-01-01T00:00:00Z",
    validTo: "2025-12-31T23:59:59Z"
  },
  {
    id: "slide3",
    title: "Gemeenschapsfeest",
    body: "Zaterdag 15 februari - groot feest voor alle families. Inschrijving bij de receptie.",
    active: true,
    durationSec: 10,
    validFrom: "2025-01-15T00:00:00Z",
    validTo: "2025-02-15T23:59:59Z"
  },
  {
    id: "slide4",
    title: "Quran Lessen",
    body: "Nieuwe cursus begint maandag. Voor kinderen van 6-12 jaar.",
    active: false,
    durationSec: 8,
    validFrom: "2025-01-01T00:00:00Z",
    validTo: "2025-06-30T23:59:59Z"
  }
];

export function getActiveSlides(nowISO: string): Slide[] {
  const now = new Date(nowISO);
  
  return mockSlides.filter(slide => {
    if (!slide.active) return false;
    
    if (slide.validFrom) {
      const validFrom = new Date(slide.validFrom);
      if (now < validFrom) return false;
    }
    
    if (slide.validTo) {
      const validTo = new Date(slide.validTo);
      if (now > validTo) return false;
    }
    
    return true;
  });
}

export function getAllSlides(): Slide[] {
  return [...mockSlides];
}

export function updateSlide(id: string, updates: Partial<Slide>): Slide {
  const index = mockSlides.findIndex(s => s.id === id);
  if (index === -1) throw new Error('Slide not found');
  
  mockSlides[index] = { ...mockSlides[index], ...updates };
  return mockSlides[index];
}

export function createSlide(slide: Omit<Slide, 'id'>): Slide {
  const newSlide: Slide = {
    ...slide,
    id: `slide${Date.now()}`
  };
  mockSlides.push(newSlide);
  return newSlide;
}

export function deleteSlide(id: string): void {
  const index = mockSlides.findIndex(s => s.id === id);
  if (index !== -1) {
    mockSlides.splice(index, 1);
  }
}