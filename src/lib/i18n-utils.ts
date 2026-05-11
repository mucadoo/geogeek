import { Country, LinkedValue, LocalizedString } from '@/types';

export const getLocalizedCountryName = (isoCode: string, locale: string, countries?: Country[]) => {
  if (countries) {
    const country = countries.find(c => c.iso_code.toUpperCase() === isoCode.toUpperCase());
    if (country && country.name) {
      return country.name[locale as keyof LocalizedString] || country.name.en;
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

export const getLocalizedValue = (value: LocalizedString | LinkedValue[] | string | string[] | undefined, locale: string): string => {
  if (!value) return 'N/A';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    if (value.length === 0) return 'N/A';
    if (typeof value[0] === 'string') return (value as string[]).join(', ');
    return (value as LinkedValue[]).map(v => getLocalizedValue(v.name, locale)).join(', ');
  }
  return value[locale as keyof LocalizedString] || value.en || '';
};
