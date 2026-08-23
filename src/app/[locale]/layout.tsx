import { Metadata } from 'next';
import { Inter, Bebas_Neue, JetBrains_Mono } from "next/font/google";
import { notFound } from 'next/navigation';
import { AbstractIntlMessages } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import NextTopLoader from 'nextjs-toploader';

import Providers from "./providers";

import AnimatedBackground from "@/components/AnimatedBackground"; 
import Header from "@/components/Header";
import SearchPalette from "@/components/SearchPalette";
import { ThemeProvider } from '@/components/ThemeProvider';
import { routing } from '@/i18n/routing';


import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const bebas = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params;
  
  if (!routing.locales.includes(locale as typeof routing.locales[number])) {
    return {};
  }

  const messages = (await import(`../../messages/${locale}.json`)).default as AbstractIntlMessages & { Metadata: { title: string; description: string } };
  
  const baseUrl = 'https://geogeek.com';
  
  const alternates: Record<string, string> = {};
  routing.locales.forEach(l => {
    alternates[l] = `${baseUrl}${l === routing.defaultLocale ? '' : `/${l}`}`;
  });

  return {
    metadataBase: new URL(baseUrl),
    title: messages.Metadata.title,
    description: messages.Metadata.description,
    manifest: '/manifest.json',
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: '64x64 32x32 24x24 16x16', type: 'image/x-icon' },
        { url: '/media/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/media/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: '/apple-icon.png',
    },
    robots: { index: true, follow: true },
    alternates: {
      canonical: `${baseUrl}${locale === routing.defaultLocale ? '' : `/${locale}`}`,
      languages: alternates,
    },
    openGraph: {
      title: messages.Metadata.title,
      description: messages.Metadata.description,
      url: `${baseUrl}${locale === routing.defaultLocale ? '' : `/${locale}`}`,
      siteName: 'GeoGeek',
      images: [
        {
          url: '/media/logo.png',
          width: 800,
          height: 600,
        },
      ],
      type: 'website',
    },
  };
}

export function generateViewport() {
  return {
    themeColor: '#00a8b5',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as typeof routing.locales[number])) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} ${bebas.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col antialiased font-sans">
        <NextTopLoader color="#00a8b5" showSpinner={false} height={3} />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers messages={messages} locale={locale}>
            <AnimatedBackground /> 
            <SearchPalette />
            <Header />
            <main className="flex-grow pt-[90px]">
              {children}
            </main>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
