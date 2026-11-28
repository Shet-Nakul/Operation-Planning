import { Member, ResourcePool, Shift } from './types';

export const MOCK_MEMBERS: Member[] = [
  {
    id: '1',
    name: 'Dr. Aris Thorne',
    role: 'Senior Surgeon',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop',
    type: 'STATIC'
  },
  {
    id: '2',
    name: 'Sarah Jenkins, RN',
    role: 'Head OR Nurse',
    avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100&h=100&fit=crop',
    type: 'STATIC'
  },
  {
    id: '3',
    name: 'Dr. Mark Walton',
    role: 'Anesthetist',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100&h=100&fit=crop',
    type: 'DYNAMIC'
  },
  {
    id: '4',
    name: 'Elena Rodriguez',
    role: 'Clinical Planner',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71f1536783?w=100&h=100&fit=crop',
    type: 'STATIC'
  }
];

export const MOCK_POOLS: ResourcePool[] = [
  {
    id: 'pool-1',
    name: 'Trauma Surgical Team',
    department: 'Surgery Department',
    location: 'East Wing, Floor 4',
    totalMembers: 24,
    weeklyHours: 840,
    contractSplit: '60/40',
    primarySkill: 'Senior Surgeon',
    status: 'active',
    icon: 'Stethoscope',
    color: 'blue'
  },
  {
    id: 'pool-2',
    name: 'Critical Response Nurses',
    department: 'ICU Intensive Care',
    location: 'Main Block, Unit C',
    totalMembers: 42,
    weeklyHours: 1680,
    contractSplit: '85/15',
    primarySkill: 'Critical Care Nurse',
    status: 'warning',
    icon: 'Activity',
    color: 'red'
  },
  {
    id: 'pool-3',
    name: 'General Anesthetics Pool',
    department: 'Perioperative Services',
    location: 'North Campus, Surgical Suite',
    totalMembers: 12,
    weeklyHours: 480,
    contractSplit: '50/50',
    primarySkill: 'Anesthetist',
    status: 'active',
    icon: 'Wind',
    color: 'teal'
  }
];

export const MOCK_SHIFTS: Shift[] = [
  {
    id: 'morning',
    name: 'Morning Shift',
    start: '07:00',
    end: '15:00',
    typical: '07:00 AM - 03:00 PM',
    icon: 'Sun',
    color: 'text-amber-500'
  },
  {
    id: 'afternoon',
    name: 'Afternoon Shift',
    start: '15:00',
    end: '23:00',
    typical: '03:00 PM - 11:00 PM',
    icon: 'CloudSun',
    color: 'text-orange-500'
  },
  {
    id: 'night',
    name: 'Night Shift',
    start: '23:00',
    end: '07:00',
    typical: '11:00 PM - 07:00 AM',
    icon: 'Moon',
    color: 'text-indigo-500'
  }
];
