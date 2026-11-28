export const credentials = {
  admin: {
    email: process.env.E2E_ADMIN_EMAIL ?? 'admin@centralhospital.com',
    password: process.env.E2E_ADMIN_PASSWORD ?? 'password123',
  },
};

export const SHIFTS = ['Day', 'Early', 'Late', 'Night'] as const;
export type Shift = (typeof SHIFTS)[number];

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type Day = (typeof DAYS)[number];

export const SHIFT_LETTERS: Record<Shift, string> = { Day: 'D', Early: 'E', Late: 'L', Night: 'N' };

export const SHIFT_TIMES: Record<Shift, string> = {
  Day: '08:00 - 16:00',
  Early: '05:00 - 13:00',
  Late: '14:00 - 22:00',
  Night: '21:00 - 05:00',
};

export const HOURS_PER_SHIFT = 8;

export const orNursingPool = {
  name: 'OR Nursing Pool',
  id: 'OR-NUR-0001',
  subtitle: 'Surgery • Main OR',
};

/** The demand cell the plan edits: Late / Wed, raised from 0 to 1. */
export const demandChange = { shift: 'Late' as Shift, day: 'Wed' as Day, value: 1 };

/** Solver runs observed at ~50-60 s; allow generous headroom. */
export const ROSTERING_TIMEOUT_MS = 240_000;
