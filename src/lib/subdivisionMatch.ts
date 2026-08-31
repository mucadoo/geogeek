import { Subdivision } from '@/types';

// The Explorer sub-map geometry (public/data/subdivisions-geometry.topo.json,
// built from Natural Earth) already carries each subdivision's ISO 3166-2 code
// as the feature `id`, so resolution is normally a direct hit. The
// normalized-name fallback across every locale is kept only as a safety net.

/** NFD-strip diacritics, fold punctuation to spaces, collapse + lowercase. */
export function normalizeName(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’'`._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}

export interface TopoFeatureLike {
  id?: string | number | null;
  properties?: { name?: string | null } | null;
}

/**
 * Resolves a sub-map TopoJSON feature to its ISO 3166-2 code within `subdivisions`
 * (already filtered to the parent country), or `null` when it has no match.
 */
export function resolveSubdivisionCode(
  countryIso: string,
  feature: TopoFeatureLike,
  subdivisions: Subdivision[],
): string | null {
  const codes = new Set(subdivisions.map((s) => s.code));

  const rawId = (feature.id != null ? String(feature.id) : '').toUpperCase();
  if (/^[A-Z]{2}-/.test(rawId) && codes.has(rawId)) return rawId;

  const target = normalizeName(feature.properties?.name);
  if (target) {
    for (const s of subdivisions) {
      for (const localized of Object.values(s.name)) {
        if (normalizeName(localized) === target) return s.code;
      }
    }
  }

  return null;
}

/** Builds a `TopoJSON feature id (string) → ISO 3166-2 code` lookup for a sub-map. */
export function buildCodeByFeatureId(
  countryIso: string,
  features: TopoFeatureLike[],
  subdivisions: Subdivision[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of features) {
    const code = resolveSubdivisionCode(countryIso, f, subdivisions);
    if (code && f.id != null) out[String(f.id)] = code;
  }
  return out;
}
