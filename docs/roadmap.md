# Roadmap

Open work for the GeoGeek frontend. Data-side work (the scraper that feeds
this app via `@mucadoo/wiki-geo-data`) lives in a separate roadmap over in
[`wikigeo-data-scraper`](../../wikigeo-data-scraper/docs/roadmap.md) — items
that need both sides are cross-linked below.

## Explorer & data portal

- [ ] **Make capital/largest-city names clickable.** `MapSidebar.tsx`
      (`src/components/MapSidebar.tsx:244-245`) renders `data.capital` and
      `data.largestCity` as plain text rows in the Quick Facts panel — no
      link, no click handler, nothing. `capital`/`largestCity` are already
      arrays of `{ articleId, name }` Wikipedia-article links in the SDK's
      data shape, so the article identity is there; this item is just the
      UI affordance (turn the value into a link/button that opens some kind
      of city detail view — modal or panel, TBD). Blocked on the scraper
      actually returning city-level detail beyond the name — see the
      matching item in the
      [wikigeo-data-scraper roadmap](../../wikigeo-data-scraper/docs/roadmap.md#data-enrichment),
      since without population/description/coordinates for the city there's
      nothing to show once the click happens beyond the name you already
      had.
