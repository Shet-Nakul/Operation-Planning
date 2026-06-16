export function generateContractId(type: string, number: number): string {
  // Determine prefix based on contract type
  const prefix = type === 'STATIC' ? 'STA' : 'DYN';
  
  // Pad number to 4 digits
  const numStr = number.toString().padStart(4, '0');
  
  return `${prefix}-${numStr}`;
}
