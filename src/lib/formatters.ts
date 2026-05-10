export function formatLargeNumber(num: number, locale: string): string {
  if (num === null || num === undefined) {
    return 'N/A';
  }

  // Use Intl.NumberFormat with compact notation for human-readable, localized large numbers
  // compactDisplay: 'long' ensures full words like 'trillion' instead of 'T'
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'long',
    maximumFractionDigits: 2,
  }).format(num);
}
