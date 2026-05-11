# 🌍 GeoGeek

<p align="center">
  <strong>A modern, high-performance geography exploration and gaming platform.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
</p>

---

**GeoGeek** transforms geographical data into an immersive, engaging experience. Built with cutting-edge web technologies, it offers a seamless way to discover political boundaries, geographical statistics, and unique country insights while challenging your knowledge with interactive games.

## ✨ Key Features

### 🗺️ Interactive Explorer Map
*   **Precision Navigation:** Seamlessly transition between global views and specific continents with D3-powered projections.
*   **Real-time Tooltips:** Instant data visualization and hover-based insights as you explore the world.
*   **Intuitive UI:** Refined navigation with "Return to World" capabilities and modern design aesthetics.

### 🎮 Geography Challenges
*   **Regional Quizzes:** Test your knowledge on US States, Brazil States, Italy Regions, France Regions, and more.
*   **Dynamic Difficulty:** Adjustable levels (Easy, Medium, Hard) with corresponding scoring multipliers.
*   **Interactive Feedback:** Uses `canvas-confetti` for a rewarding user experience.

### 📊 Comprehensive Data Portal
*   **Deep Dives:** Access profiles for countries, including capitals, languages, demographics, GDP, and HDI.
*   **Comparative Rankings:** Explore world rankings based on population, area, and other key geographic metrics.
*   **Wikipedia-Powered:** Consumes the [Wikipedia Country Info Scraper API](https://github.com/mucadoo/country-info-scraper) for up-to-date information.

### 🌐 Advanced Modern Stack
*   **Multilingual:** Internationalization support via `next-intl`.
*   **Performance First:** Optimized with TanStack Query and Zustand for efficient state management.
*   **Fully Responsive:** Crafted with Tailwind CSS 4 for a perfect experience on any device.

---

## 🛠️ Technology Stack

| Category | Tools |
| :--- | :--- |
| **Framework** | [Next.js](https://nextjs.org/) (App Router), [React](https://react.dev/) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/) |
| **Maps** | [D3.js](https://d3js.org/), [TopoJSON](https://github.com/topojson/topojson) |
| **State** | [Zustand](https://zustand.docs.pmndrs.org/), [TanStack Query](https://tanstack.com/query/latest) |
| **Language** | [TypeScript](https://www.typescriptlang.org/), [next-intl](https://next-intl-docs.vercel.app/) |

---

## 🚀 Getting Started

1.  **Clone the repo:**
    ```bash
    git clone https://github.com/mucadoo/geo-geek.git
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Launch development server:**
    ```bash
    npm run dev
    ```
4.  **Explore:** Head over to `http://localhost:3000`.

---

## 🏗️ Deployment

The project is configured for automated deployment via **GitHub Actions**, pushing production-ready builds to GitHub Pages.
Live Demo: [GeoGeek on Vercel](https://geo-geek.vercel.app/)

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature' --trailer "Co-authored-by: Junie <junie@jetbrains.com>"`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<p align="center">
  <i>GeoGeek - Discovering the world, one territory at a time.</i>
</p>
