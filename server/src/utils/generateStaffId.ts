export function generateStaffId(name: string, number: number): string {
  // Split name into words and filter out empty strings
  const words = name.split(/\s+/).filter(word => word.length > 0);
  
  let initials = '';
  if (words.length === 1) {
    // Take first 2 letters from single word
    initials = words[0].substring(0, 2).toUpperCase();
  } else {
    // Take first letter from first two words
    initials = (words[0][0] + words[1][0]).toUpperCase();
  }
  
  // Pad number to 4 digits
  const numStr = number.toString().padStart(4, '0');
  
  return `STAFF-${initials}-${numStr}`;
}
