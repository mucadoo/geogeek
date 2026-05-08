import { MetadataRoute } from 'next';

import { CONTINENT_VIEWS } from '@/config/mapConstants';
import { routing } from '@/i18n/routing';

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://geogeek.com';
  const continents = Object.keys(CONTINENT_VIEWS).map((c) => c.toLowerCase().replace(' ', '-'));
  const routes = ['', '/map', '/rankings', '/games'];

  const sitemap: MetadataRoute.Sitemap = [];

  routes.forEach((route) => {
    routing.locales.forEach((locale) => {
      const localePrefix = locale === routing.defaultLocale ? '' : `/${locale}`;
      sitemap.push({
        url: `${baseUrl}${localePrefix}${route}`,
        lastModified: new Date(),
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [l, `${baseUrl}${l === routing.defaultLocale ? '' : `/${l}`}${route}`])
          ),
        },
      });
    });
  });

  // Add continent routes
  continents.forEach((continent) => {
    routing.locales.forEach((locale) => {
      const localePrefix = locale === routing.defaultLocale ? '' : `/${locale}`;
      const route = `/map/${continent}`;
      sitemap.push({
        url: `${baseUrl}${localePrefix}${route}`,
        lastModified: new Date(),
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [l, `${baseUrl}${l === routing.defaultLocale ? '' : `/${l}`}${route}`])
          ),
        },
      });
    });
  });

  return sitemap;
}
