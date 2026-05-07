export const getLocalizedCountryName = (isoCode: string, locale: string) => {
  try {
    // Some ISO codes might need cleanup or are not 2-letter
    const code = isoCode.length > 2 ? isoCode.substring(0, 2) : isoCode;
    const displayNames = new Intl.DisplayNames([locale], { type: 'region' });
    return displayNames.of(code.toUpperCase()) || isoCode;
  } catch {
    return isoCode;
  }
};
