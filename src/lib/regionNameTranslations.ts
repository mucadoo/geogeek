import de from '@/messages/de.json';
import en from '@/messages/en.json';
import es from '@/messages/es.json';
import fr from '@/messages/fr.json';
import it from '@/messages/it.json';
import ja from '@/messages/ja.json';
import pt from '@/messages/pt.json';
import ru from '@/messages/ru.json';
import zh from '@/messages/zh.json';

// RegionNames only covers curated sub-national lists (US/Brazil/Italy/France/
// Canada/Australia/South-America states, provinces, regions) - it's the sole
// translation source for those, unlike sovereign countries which come from
// wiki-geo-data. All 9 locale files carry the same RegionNames key set, so
// this is a plain static lookup, not a per-request computation.
const CATALOGS = [en, pt, es, fr, it, de, ja, ru, zh] as const;

/** Every translation of a raw (English) RegionNames key across all 9
 *  supported locales, excluding the raw name itself and locales where the
 *  translation is identical to it. */
export function getRegionNameTranslations(rawName: string): string[] {
  const variants = new Set<string>();
  for (const catalog of CATALOGS) {
    const value = (catalog.RegionNames as Record<string, string>)[rawName];
    if (value && value !== rawName) variants.add(value);
  }
  return [...variants];
}
