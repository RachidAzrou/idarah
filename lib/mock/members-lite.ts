export type MemberLite = {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  category: 'Senior' | 'Volwassene' | 'Student' | 'Jeugd';
  hasMandate: boolean;
  iban?: string;
};

export const membersLite: MemberLite[] = [
  { 
    id: 'm1', 
    memberNumber: '0001', 
    firstName: 'Emma', 
    lastName: 'van der Berg', 
    category: 'Senior', 
    hasMandate: true, 
    iban: 'BE71 0961 2345 6769' 
  },
  { 
    id: 'm2', 
    memberNumber: '0002', 
    firstName: 'Lars', 
    lastName: 'Jansen', 
    category: 'Jeugd', 
    hasMandate: false 
  },
  { 
    id: 'm3', 
    memberNumber: '0003', 
    firstName: 'Fatima', 
    lastName: 'El Amrani', 
    category: 'Volwassene', 
    hasMandate: true,
    iban: 'BE68 5390 0754 7034'
  },
  { 
    id: 'm4', 
    memberNumber: '0004', 
    firstName: 'Ahmed', 
    lastName: 'Hassan', 
    category: 'Volwassene', 
    hasMandate: true,
    iban: 'BE02 2100 0012 3456'
  },
  { 
    id: 'm5', 
    memberNumber: '0005', 
    firstName: 'Sophie', 
    lastName: 'Dubois', 
    category: 'Student', 
    hasMandate: false
  },
  { 
    id: 'm6', 
    memberNumber: '0006', 
    firstName: 'Omar', 
    lastName: 'Benali', 
    category: 'Volwassene', 
    hasMandate: true,
    iban: 'BE45 2300 1234 5678'
  },
  { 
    id: 'm7', 
    memberNumber: '0007', 
    firstName: 'Maria', 
    lastName: 'Rodriguez', 
    category: 'Senior', 
    hasMandate: false
  },
  { 
    id: 'm8', 
    memberNumber: '0008', 
    firstName: 'Ibrahim', 
    lastName: 'Yilmaz', 
    category: 'Volwassene', 
    hasMandate: true,
    iban: 'BE12 0001 2345 6789'
  }
];