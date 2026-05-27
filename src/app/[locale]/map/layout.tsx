import { setRequestLocale } from 'next-intl/server';
import React from 'react';

export default async function MapLayout({ 
  children,
  params 
}: { 
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="animate-in fade-in fixed inset-0 z-0 h-screen w-screen bg-[#f1f5f3] duration-1000">
      {children}
    </main>
  );
}
