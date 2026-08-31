// Builds public/data/subdivisions-geometry.topo.json — one simplified TopoJSON
// holding a polygon for (almost) every first-level administrative subdivision,
// keyed by ISO 3166-2 code so the Explorer can join it directly to the
// wiki-geo-data subdivision dataset.
//
// Source: Natural Earth `ne_10m_admin_1_states_provinces` (public domain). NE's
// admin-1 layer is finer-grained than ISO 3166-2 level-1 for some countries
// (France = 101 departments, Italy = 110 provinces), so each NE feature is
// assigned to a wiki-geo-data subdivision — by ISO 3166-2 code where NE carries
// a matching one, otherwise by nearest subdivision centre point — and the
// features are then dissolved by that assignment.
//
// Run manually when Natural Earth or public/data/fallback-subdivisions.json
// changes materially:  npm run data:build-subdivision-geometry
//
// Requires network access and `npx` (pulls mapshaper on first run).

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SUBDIVISIONS = path.join(ROOT, 'public/data/fallback-subdivisions.json');
const OUT = path.join(ROOT, 'public/data/subdivisions-geometry.topo.json');
const NE_URL =
  'https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_1_states_provinces.zip';
const SIMPLIFY_PCT = process.env.SIMPLIFY_PCT || '12';

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'geo-subdiv-'));
const cache = path.join(os.tmpdir(), 'geogeek-ne-admin1.zip');
const rawGeo = path.join(work, 'ne-admin1.geojson');
const tagged = path.join(work, 'subdivisions.geojson');

const mapshaper = (args) =>
  execFileSync('npx', ['--yes', 'mapshaper@0.7', ...args], { stdio: ['ignore', 'ignore', 'inherit'] });

// NE `iso_a2` is "-99" for a handful of features; patch the ones that carry
// subdivisions in the dataset from `adm0_a3`.
const A3_TO_A2 = {
  FRA: 'FR', NOR: 'NO', KOS: 'XK', SDS: 'SS', SOL: 'SO', PSX: 'PS',
  CYN: 'CY', SAH: 'EH', ALD: 'FI', GRL: 'GL', ATF: 'TF',
};

async function download() {
  if (fs.existsSync(cache) && fs.statSync(cache).size > 1_000_000) {
    console.log(`Using cached ${cache}`);
    return;
  }
  console.log(`Downloading ${NE_URL} …`);
  const res = await fetch(NE_URL);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  fs.writeFileSync(cache, Buffer.from(await res.arrayBuffer()));
  console.log(`Saved ${(fs.statSync(cache).size / 1e6).toFixed(1)} MB`);
}

function bboxCentre(geometry) {
  let minX = 180, minY = 90, maxX = -180, maxY = -90;
  const walk = (a) => {
    if (typeof a[0] === 'number') {
      if (a[0] < minX) minX = a[0];
      if (a[0] > maxX) maxX = a[0];
      if (a[1] < minY) minY = a[1];
      if (a[1] > maxY) maxY = a[1];
    } else for (const el of a) walk(el);
  };
  walk(geometry.coordinates);
  return [(minX + maxX) / 2, (minY + maxY) / 2];
}

async function main() {
  await download();

  console.log('Unpacking shapefile …');
  execFileSync('unzip', ['-o', '-j', cache, '*.shp', '*.dbf', '*.shx', '*.prj', '-d', work], {
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  const shp = fs
    .readdirSync(work)
    .find((f) => f.endsWith('.shp'));
  if (!shp) throw new Error('No .shp found in the Natural Earth archive');

  console.log('Converting shapefile → GeoJSON …');
  mapshaper([
    path.join(work, shp),
    '-filter-fields', 'iso_3166_2,iso_a2,adm0_a3',
    '-o', 'format=geojson', rawGeo,
  ]);

  const geo = JSON.parse(fs.readFileSync(rawGeo, 'utf8'));
  const subs = JSON.parse(fs.readFileSync(SUBDIVISIONS, 'utf8')).data;

  const byCountry = new Map();
  for (const s of subs) {
    if (!s.coordinates) continue;
    if (!byCountry.has(s.countryIsoCode)) byCountry.set(s.countryIsoCode, []);
    byCountry.get(s.countryIsoCode).push(s);
  }

  let assigned = 0;
  const kept = [];
  for (const f of geo.features) {
    const p = f.properties;
    const iso2 = p.iso_a2 && p.iso_a2 !== '-99' ? p.iso_a2 : A3_TO_A2[p.adm0_a3];
    const candidates = iso2 ? byCountry.get(iso2) : null;
    if (!candidates) continue;

    let best = candidates.find((s) => s.code === String(p.iso_3166_2 || '').toUpperCase());
    if (!best) {
      const [cx, cy] = bboxCentre(f.geometry);
      let bestDist = Infinity;
      for (const s of candidates) {
        const dx = s.coordinates.lng - cx;
        const dy = s.coordinates.lat - cy;
        const d = dx * dx + dy * dy;
        if (d < bestDist) {
          bestDist = d;
          best = s;
        }
      }
    }
    if (!best) continue;

    assigned++;
    kept.push({ type: 'Feature', properties: { sub_code: best.code }, geometry: f.geometry });
  }

  fs.writeFileSync(tagged, JSON.stringify({ type: 'FeatureCollection', features: kept }));

  console.log(`Dissolving + simplifying (${SIMPLIFY_PCT}%) …`);
  mapshaper([
    tagged,
    '-dissolve', 'sub_code',
    '-simplify', 'visvalingam', `percentage=${SIMPLIFY_PCT}%`, 'keep-shapes',
    '-clean',
    '-o', 'format=topojson', 'quantization=1e5', 'id-field=sub_code', OUT,
  ]);

  const topo = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  const polygons = topo.objects[Object.keys(topo.objects)[0]].geometries;
  const covered = new Set(polygons.map((g) => g.id));
  const gaps = {};
  for (const s of subs) {
    if (!covered.has(s.code)) gaps[s.countryIsoCode] = (gaps[s.countryIsoCode] || 0) + 1;
  }
  const gapList = Object.entries(gaps).sort((a, b) => b[1] - a[1]);

  fs.rmSync(work, { recursive: true, force: true });

  console.log(
    `\nWrote ${path.relative(ROOT, OUT)} — ` +
      `${(fs.statSync(OUT).size / 1e6).toFixed(2)} MB, ${polygons.length} polygons.`
  );
  console.log(
    `Coverage: ${covered.size}/${subs.length} subdivisions ` +
      `(${((covered.size / subs.length) * 100).toFixed(1)}%), ${assigned} NE features used.`
  );
  if (gapList.length) {
    console.log(
      `Gap countries (no NE geometry at this level): ` +
        gapList.map(([c, n]) => `${c}:${n}`).join(' ')
    );
  }
}

main().catch((err) => {
  fs.rmSync(work, { recursive: true, force: true });
  console.error(err);
  process.exit(1);
});
