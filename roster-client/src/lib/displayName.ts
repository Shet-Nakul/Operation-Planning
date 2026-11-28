export function displayName(value: string): string {
  const name = value.trim();
  if (!name || name !== name.toLocaleUpperCase()) return name;
  return name.toLocaleLowerCase().replace(/(^|[\s'-])\p{L}/gu, part => part.toLocaleUpperCase());
}
