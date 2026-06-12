export function generatePoolId(poolName: string, number: number): string {
  // Split pool name into words
  const words = poolName.split(/\s+/).filter(word => word.length > 0);
  
  let prefix = '';
  if (words.length >= 2) {
    // Take first 3 chars of first 2 words
    const first = words[0].substring(0, 3).toUpperCase();
    const second = words[1].substring(0, 3).toUpperCase();
    prefix = `${first}-${second}`;
  } else {
    // Take first 3 chars of single word
    const first = words[0].substring(0, 3).toUpperCase();
    prefix = first;
  }
  
  // Pad number to 4 digits
  const numStr = number.toString().padStart(4, '0');
  
  return `${prefix}-${numStr}`;
}
