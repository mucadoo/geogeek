import {createNavigation} from 'next-intl/navigation';
import {defineRouting} from 'next-intl/routing';
 
export const routing = defineRouting({
  locales: ['en', 'pt', 'es', 'fr', 'it', 'de', 'ja', 'zh', 'ru'],
  defaultLocale: 'en',
  localePrefix: 'never'
});
 
export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);
