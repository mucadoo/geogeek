import { Country, LinkedValue, LocalizedString } from '@/types';

export const getLocalizedCountryName = (isoCode: string, locale: string, countries?: Country[]) => {
  if (countries) {
    const country = countries.find(c => c.isoCode?.toUpperCase() === isoCode.toUpperCase());
    if (country && country.name) {
      return country.name[locale as keyof LocalizedString] || country.name.en || isoCode;
    }
  }

  try {
    // Some ISO codes might need cleanup or are not 2-letter
    const code = isoCode.length > 2 ? isoCode.substring(0, 2) : isoCode;
    const displayNames = new Intl.DisplayNames([locale], { type: 'region' });
    return displayNames.of(code.toUpperCase()) || isoCode;
  } catch {
    return isoCode;
  }
};

export const getLocalizedValue = (value: LocalizedString | LinkedValue[] | string | string[] | null | undefined, locale: string): string => {
  if (!value) return 'N/A';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    if (value.length === 0) return 'N/A';
    if (typeof value[0] === 'string') return (value as string[]).filter(Boolean).join(', ') || 'N/A';
    return (value as LinkedValue[]).map(v => getLocalizedValue(v.name, locale)).filter(s => s !== 'N/A').join(', ') || 'N/A';
  }
  return value[locale as keyof LocalizedString] || value.en || 'N/A';
};
