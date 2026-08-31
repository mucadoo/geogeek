import 'server-only';
import fs from 'fs/promises';
import path from 'path';

// Shared helpers for gating features on the installed @mucadoo/wiki-geo-data
// version. Both countryService and subdivisionService read the same bundled
// local snapshot instead of the SDK/GitHub-Pages data whenever the installed
// package predates the schema they need.

/** Reads the version of the installed @mucadoo/wiki-geo-data package, or null
 *  if it can't be determined (in which case callers should not trust it). */
export async function getInstalledSdkVersion(): Promise<string | null> {
  try {
    const pkgPath = path.join(process.cwd(), 'node_modules/@mucadoo/wiki-geo-data/package.json');
    const raw = await fs.readFile(pkgPath, 'utf-8');
    const { version } = JSON.parse(raw) as { version: string };
    return typeof version === 'string' ? version : null;
  } catch {
    return null;
  }
}

/** Semver-ish comparison: true when `version` (e.g. "0.1.18") is >= the
 *  `[major, minor, patch]` tuple. A null/blank version is treated as too old. */
export function isVersionAtLeast(version: string | null, min: readonly number[]): boolean {
  if (!version) return false;
  const parts = version.split('.').map((p) => parseInt(p, 10));
  for (let i = 0; i < min.length; i++) {
    const part = parts[i] || 0;
    if (part !== min[i]) return part > min[i];
  }
  return true;
}

/** Convenience: is the installed SDK at least `min`? */
export async function installedSdkIsAtLeast(min: readonly number[]): Promise<boolean> {
  return isVersionAtLeast(await getInstalledSdkVersion(), min);
}
