import {getRequestConfig} from 'next-intl/server';

import {routing} from './routing';
 
export default getRequestConfig(async ({requestLocale}) => {
  // This typically corresponds to the `[locale]` segment
  const locale = await requestLocale;
 
  // Ensure that a valid locale is used
  const validLocale = routing.locales.find((l) => l === locale) || routing.defaultLocale;
 
  return {
    locale: validLocale,
    messages: (await import(`../messages/${validLocale}.json`)).default,
    timeZone: 'UTC'
  };
});
