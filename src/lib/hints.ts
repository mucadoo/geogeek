import { getCountryFact } from '@/data/countryFacts';
import { getRegionFact } from '@/data/regionFacts';
import { Country, LocalizedString } from '@/types';

/** First letter + character count of a name, for the level-1 (cheapest) hint.
 *  Spaces are excluded from the count so "New York" reads as 7, not 8. */
export function getHintLetterClue(name: string): { letter: string; count: number } {
  const trimmed = name.trim();
  return {
    letter: trimmed.charAt(0).toUpperCase(),
    count: trimmed.replace(/\s+/g, '').length,
  };
}

// Wikipedia descriptions occasionally name the capital later in the
// paragraph (e.g. "Its capital and largest city is X.") - in capital-guessing
// mode that would hand over the answer outright, so the fun fact only ever
// surfaces the first sentence, where that almost never appears.
function firstSentence(text: string): string {
  const match = text.match(/^.*?[.!?](?=\s|$)/);
  return (match ? match[0] : text).trim();
}

/** Level-2 hint: a short localized fun fact about the current target.
 *  Sovereign countries use the hand-authored COUNTRY_FACTS catalog first -
 *  punchier and more "fun" than a Wikipedia opener - falling back to the
 *  first sentence of the existing wiki-geo-data description for any country
 *  missing from that catalog. Sub-national regions (US states, Brazil
 *  states, etc.) pull from the hand-authored REGION_FACTS catalog. Returns
 *  null if nothing is available - callers should hide the "reveal fact"
 *  step in that case. */
export function getHintFact(rawName: string, locale: string, allCountries: Country[]): string | null {
  const country = allCountries.find((c) => c.name.en === rawName);
  if (country) {
    const curated = getCountryFact(rawName);
    if (curated) return curated[locale as keyof LocalizedString] || curated.en;
    const desc = country.description?.[locale as keyof LocalizedString] || country.description?.en;
    if (desc) return firstSentence(desc);
  }
  const fact = getRegionFact(rawName);
  if (fact) return fact[locale as keyof LocalizedString] || fact.en;
  return null;
}
