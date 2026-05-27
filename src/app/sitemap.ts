import fs from 'fs';
import path from 'path';

import { MetadataRoute } from 'next';

import { CONTINENT_VIEWS } from '@/config/mapConstants';
import { routing } from '@/i18n/routing';

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://geogeek.com';
  const continents = Object.keys(CONTINENT_VIEWS).map((c) => c.toLowerCase().replace(' ', '-'));
  const routes = ['', '/map', '/rankings', '/games', '/about', '/compare'];

  const sitemap: MetadataRoute.Sitemap = [];

  // Read country list synchronously (sitemap is static-ish and built during dynamic compile)
  let countryCodes: string[] = [];
  try {
    const fallbackPath = path.join(process.cwd(), 'public/data/fallback-countries.json');
    const data = fs.readFileSync(fallbackPath, 'utf-8');
    const json = JSON.parse(data);
    const countries = json.data || [];
    countryCodes = countries.map((c: any) => c.isoCode?.toLowerCase()).filter(Boolean);
  } catch (error) {
    console.error('Error reading country data for sitemap:', error);
  }

  // 1. Static base routes
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

  // 2. Continent routes
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

  // 3. Country routes (Dynamic country discovery for Google Crawler indexing)
  countryCodes.forEach((code) => {
    routing.locales.forEach((locale) => {
      const localePrefix = locale === routing.defaultLocale ? '' : `/${locale}`;
      const route = `/map/${code}`;
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
