import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NextTopLoader from 'nextjs-toploader';

import Providers from "./providers";

import Header from "@/components/Header";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GeoGeek - Explore the geographer inside you",
  description: "Interactive geography explorer and rankings",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <NextTopLoader color="#00a8b5" showSpinner={false} height={3} />
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
