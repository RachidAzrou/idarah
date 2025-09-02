/**
 * Mock members data for development
 */

export interface MemberLite {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  category: 'STUDENT' | 'STANDAARD' | 'SENIOR';
  active: boolean;
}

// Mock members data
export const membersLite: MemberLite[] = [
  {
    id: 'member_1',
    memberNumber: 'M001',
    firstName: 'Jan',
    lastName: 'Janssens',
    category: 'STANDAARD',
    active: true,
  },
  {
    id: 'member_2', 
    memberNumber: 'M002',
    firstName: 'Marie',
    lastName: 'Peeters',
    category: 'STANDAARD',
    active: true,
  },
  {
    id: 'member_3',
    memberNumber: 'M003', 
    firstName: 'Ahmed',
    lastName: 'Hassan',
    category: 'STUDENT',
    active: true,
  },
  {
    id: 'member_4',
    memberNumber: 'M004',
    firstName: 'Fatima',
    lastName: 'Al-Zahra',
    category: 'SENIOR', 
    active: true,
  },
  {
    id: 'member_5',
    memberNumber: 'M005',
    firstName: 'Mohamed',
    lastName: 'El-Mansouri',
    category: 'STANDAARD',
    active: false,
  }
];

// Helper function to get active members
export function getActiveMembers(): MemberLite[] {
  return membersLite.filter(member => member.active);
}

// Helper function to get member by ID
export function getMemberById(id: string): MemberLite | undefined {
  return membersLite.find(member => member.id === id);
}

// Helper function to get member by number
export function getMemberByNumber(memberNumber: string): MemberLite | undefined {
  return membersLite.find(member => member.memberNumber === memberNumber);
}