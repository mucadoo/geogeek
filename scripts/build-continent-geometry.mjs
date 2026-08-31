// Builds public/data/continents-geometry.topo.json — one simplified TopoJSON
// whose geometries are country (sub)units, each tagged with the continent it
// physically sits in. The Explorer uses it two ways:
//   • world overview — geometries merged by `continent` into six hoverable shapes
//   • continent drill-down (/map/<continent>) — geometries filtered by
//     `continent`, each still clickable through to its country (`id` = ISO 3166-1
//     alpha-2 of the sovereign state)
//
// Source: Natural Earth `ne_50m_admin_0_map_subunits` (public domain). NE already
// splits Russia into its European and Asian halves; Kazakhstan, Turkey and Egypt
// are split here against hand-drawn masks (Ural river, the Turkish Straits, the
// Suez isthmus). The Caucasus states are left wholly in Asia by choice.
//
// Run manually when Natural Earth changes or the split conventions do:
//   npm run data:build-continent-geometry
//
// Requires network access and `npx` (pulls mapshaper on first run).

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public/data/continents-geometry.topo.json');
const NE_URL =
  'https://naciscdn.org/naturalearth/50m/cultural/ne_50m_admin_0_map_subunits.zip';
const SIMPLIFY_PCT = process.env.SIMPLIFY_PCT || '15';

const CONTINENTS = new Set([
  'Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania',
]);

// Countries NE keeps whole but that straddle the Europe/Asia (or Africa/Asia)
// line — clipped below against the matching mask.
const SPLIT = {
  KAZ: { mask: 'europe', inside: 'Europe', outside: 'Asia' },
  TUR: { mask: 'europe', inside: 'Europe', outside: 'Asia' },
  EGY: { mask: 'sinai', inside: 'Asia', outside: 'Africa' },
};

// A generous polygon covering geographic Europe. Only ever intersected with
// Kazakhstan and Turkey, so it only has to be accurate down the Ural river / the
// north Caspian shore and through the Turkish Straits; elsewhere it just has to
// stay clear of Asian land.
const EUROPE_MASK = [
  [15, 33], [15, 62], [53, 62], [51.4, 51], [51.4, 47], [49, 44.5], [47, 45],
  [40, 45.5], [36, 44], [30, 43.2], [29.3, 41.3], [28.9, 41.0], [28.5, 40.6],
  [26.8, 40.3], [26.1, 40.0], [25.8, 33], [15, 33],
];

// The Sinai peninsula — everything east of the Suez Canal and the Gulf of Suez.
const SINAI_MASK = [
  [32.35, 31.4], [34.3, 31.4], [34.95, 29.3], [34.0, 27.6], [33.2, 28.3],
  [32.35, 30.1], [32.35, 31.4],
];

const cache = path.join(os.tmpdir(), 'geogeek-ne-map-subunits.zip');

const mapshaper = (args) =>
  execFileSync('npx', ['--yes', 'mapshaper@0.7', ...args], {
    stdio: ['ignore', 'ignore', 'inherit'],
  });

async function download() {
  if (fs.existsSync(cache) && fs.statSync(cache).size > 100_000) {
    console.log(`Using cached ${cache}`);
    return;
  }
  console.log(`Downloading ${NE_URL} …`);
  const res = await fetch(NE_URL);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  fs.writeFileSync(cache, Buffer.from(await res.arrayBuffer()));
  console.log(`Saved ${(fs.statSync(cache).size / 1e6).toFixed(1)} MB`);
}

function centroid(geometry) {
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

function polygonFC(ring, id) {
  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: { id },
      geometry: { type: 'Polygon', coordinates: [ring] },
    }],
  };
}

async function main() {
  await download();

  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'geo-cont-'));
  try {
    execFileSync('unzip', ['-o', '-j', cache, '*.shp', '*.dbf', '*.shx', '*.prj', '-d', work], {
      stdio: ['ignore', 'ignore', 'inherit'],
    });
    const shp = fs.readdirSync(work).find((f) => f.endsWith('.shp'));
    if (!shp) throw new Error('No .shp in the Natural Earth archive');

    const rawGeo = path.join(work, 'subunits.geojson');
    mapshaper([
      path.join(work, shp),
      '-filter-fields', 'ADM0_A3,ISO_A2,ISO_A2_EH,CONTINENT,REGION_UN,SUBUNIT',
      '-o', 'format=geojson', rawGeo,
    ]);
    const geo = JSON.parse(fs.readFileSync(rawGeo, 'utf8'));

    // ADM0_A3 → clean alpha-2, learned from every feature that carries one.
    const a3ToA2 = {};
    for (const f of geo.features) {
      const a2 = f.properties.ISO_A2;
      if (/^[A-Z]{2}$/.test(a2)) a3ToA2[f.properties.ADM0_A3] ??= a2;
    }
    const isoOf = (p) => {
      if (a3ToA2[p.ADM0_A3]) return a3ToA2[p.ADM0_A3];
      if (/^[A-Z]{2}$/.test(p.ISO_A2)) return p.ISO_A2;
      if (/^[A-Z]{2}$/.test(p.ISO_A2_EH)) return p.ISO_A2_EH;
      return null;
    };
    // Physical continent for a subunit: NE's CONTINENT when it is a real one,
    // else fall back to REGION_UN (splitting "Americas" by position), else drop
    // (Antarctica and the open-ocean specks).
    const contOf = (p, geom) => {
      if (CONTINENTS.has(p.CONTINENT)) return p.CONTINENT;
      const r = p.REGION_UN;
      if (CONTINENTS.has(r)) return r;
      if (r === 'Americas') {
        const [lng, lat] = centroid(geom);
        return lat < 13 && lng > -82 ? 'South America' : 'North America';
      }
      return null;
    };

    const tagged = []; // { iso, continent, geometry }
    const splitSrc = {}; // ADM0_A3 -> [features]

    for (const f of geo.features) {
      const p = f.properties;
      if (SPLIT[p.ADM0_A3]) {
        (splitSrc[p.ADM0_A3] ||= []).push(f);
        continue;
      }
      const iso = isoOf(p);
      const continent = contOf(p, f.geometry);
      if (!iso || !continent) continue;
      tagged.push({ iso, continent, geometry: f.geometry });
    }

    // Clip the straddlers against their mask (inside piece) and erase it (outside
    // piece). mapshaper does the boolean ops; we just re-tag the halves.
    fs.writeFileSync(path.join(work, 'europe-mask.geojson'), JSON.stringify(polygonFC(EUROPE_MASK, 'europe')));
    fs.writeFileSync(path.join(work, 'sinai-mask.geojson'), JSON.stringify(polygonFC(SINAI_MASK, 'sinai')));

    for (const [a3, feats] of Object.entries(splitSrc)) {
      const { mask, inside, outside } = SPLIT[a3];
      const iso = isoOf(feats[0].properties);
      const src = path.join(work, `${a3}.geojson`);
      const maskFile = path.join(work, `${mask}-mask.geojson`);
      fs.writeFileSync(src, JSON.stringify({
        type: 'FeatureCollection',
        features: feats.map((f) => ({ type: 'Feature', properties: {}, geometry: f.geometry })),
      }));

      for (const [op, continent] of [['clip', inside], ['erase', outside]]) {
        const dst = path.join(work, `${a3}-${op}.geojson`);
        mapshaper([src, `-${op}`, maskFile, '-o', 'format=geojson', dst]);
        const fc = JSON.parse(fs.readFileSync(dst, 'utf8'));
        // mapshaper emits a bare GeometryCollection when features carry no
        // properties, otherwise a FeatureCollection.
        const parts = fc.features
          ? fc.features.map((f) => f.geometry)
          : (fc.geometries || []);
        for (const g of parts) {
          if (g && g.coordinates?.length) tagged.push({ iso, continent, geometry: g });
        }
      }
    }

    const combined = path.join(work, 'combined.geojson');
    fs.writeFileSync(combined, JSON.stringify({
      type: 'FeatureCollection',
      features: tagged.map((t) => ({
        type: 'Feature',
        properties: { iso: t.iso, continent: t.continent },
        geometry: t.geometry,
      })),
    }));

    console.log(`Dissolving + simplifying (${SIMPLIFY_PCT}%) …`);
    mapshaper([
      combined,
      '-dissolve2', 'fields=iso,continent',
      '-simplify', 'visvalingam', `percentage=${SIMPLIFY_PCT}%`, 'keep-shapes',
      '-clean',
      '-o', 'format=topojson', 'quantization=1e5', 'id-field=iso', OUT,
    ]);

    const topo = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    const geoms = topo.objects[Object.keys(topo.objects)[0]].geometries;
    const byCont = {};
    for (const g of geoms) {
      const c = g.properties?.continent || '??';
      byCont[c] = (byCont[c] || 0) + 1;
    }
    console.log(
      `\nWrote ${path.relative(ROOT, OUT)} — ` +
        `${(fs.statSync(OUT).size / 1e6).toFixed(2)} MB, ${geoms.length} geometries.`
    );
    console.log('Per continent:', byCont);
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
