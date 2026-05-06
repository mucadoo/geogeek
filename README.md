# GeoGeek

GeoGeek is a modern, interactive geography exploration platform built with **Next.js**, **React**, **TypeScript**, and **Tailwind CSS**. Designed to make geography education engaging, GeoGeek offers an immersive experience for discovering political boundaries, geographical statistics, and unique country insights.

## Core Features

### 🌍 Interactive Explorer Map
*   **Drill-down Navigation:** Seamlessly transition between global views and specific continents.
*   **Interactive Tooltips:** Real-time data visualization and hover-based insights as you explore the world.
*   **Intuitive UI:** Refined navigation with easy "Return to World" capabilities, featuring interactive hover states and modern design aesthetics.

### 🗺️ Country Data Portal
*   **Deep Dives:** Access comprehensive profiles for countries, including capital cities, official languages, demographic statistics, economic data (GDP, HDI), and more.
*   **Polished Presentation:** Information is displayed in structured, clean layouts with high-quality imagery and typography for optimal readability.

### 📊 Geographical Rankings
*   **Comparative Insights:** Explore world rankings based on population, land area, and other key geographic metrics to better understand the world political territory.

## Data Source

This project consumes the public [Wikipedia Country Info Scraper API](https://github.com/mucadoo/country-info-scraper) that I created, which provides structured country data that is kept up to date with Wikipedia.

## Technology Stack

*   **Framework:** [Next.js](https://nextjs.org/) (App Router).
*   **Library:** [React](https://react.dev/).
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) with a focus on custom, responsive design and accessibility.
*   **Maps:** [D3.js](https://d3js.org/) for high-performance, custom vector-based map projections and interactive zooming.
*   **State Management:** [Zustand](https://zustand.docs.pmndrs.org/).
*   **Data Fetching:** [TanStack React Query](https://tanstack.com/query/latest).
*   **Type Safety:** Fully typed with [TypeScript](https://www.typescriptlang.org/).
*   **Performance:** Optimized for speed, featuring efficient client-side state management and static generation.

## Getting Started

To run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

## Deployment

The project is configured for automated deployment via GitHub Actions, pushing the production-ready build to GitHub Pages. You can view the live application here: [GeoGeek on Vercel](https://geo-geek.vercel.app/)

---
*GeoGeek - Discovering the world, one territory at a time.*
