export function generateSurgeryId(name: string, number: number): string {
  // Take the first 3 letters of the patient's first name
  const words = name.split(/\s+/).filter(word => word.length > 0);
  const namePart = (words[0] || '').substring(0, 3).toUpperCase().padEnd(3, 'X');

  // Pad number to 4 digits
  const numStr = number.toString().padStart(4, '0');

  return `SURG-${namePart}-${numStr}`;
}
