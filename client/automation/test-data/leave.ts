import { randomUUID } from 'node:crypto';

export const credentials = {
  megan: {
    email: process.env.LEAVE_MEGAN_EMAIL ?? 'megan.roberts@hospital.ca',
    password: process.env.LEAVE_MEGAN_PASSWORD ?? 'megan@123',
  },
  michael: {
    email: process.env.LEAVE_MICHAEL_EMAIL ?? 'michael.anderson@hospital.ca',
    password: process.env.LEAVE_MICHAEL_PASSWORD ?? 'mike@123',
  },
};

export const leaveTestData = {
  megan: {
    name: 'Megan Roberts',
    staffId: 'STAFF-0310',
  },
  mutationOptInVariable: 'LEAVE_E2E_ALLOW_MUTATIONS',
} as const;

export function leaveData(day: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + 1, day);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, day + 1);
  const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return { start: iso(start), end: iso(end), reason: `E2E leave ${randomUUID()}` };
}
