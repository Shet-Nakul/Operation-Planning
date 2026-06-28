// Normalizes a string for loose matching (case/spacing/punctuation-insensitive),
// e.g. "or_nurse" and "OR Nurse" both slugify to "ornurse".
export const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
