'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

interface MapSidebarProps {
  type: 'continent' | 'country';
  title: string;
  data?: any;
}

export default function MapSidebar({ type, title, data }: MapSidebarProps) {
  const router = useRouter();

  return (
    <div className="absolute right-4 top-24 z-30 flex h-[80vh] w-80 flex-col overflow-hidden rounded-lg border-2 border-dashed border-[#8d99ae] bg-[var(--card-bg)] p-6 shadow-2xl backdrop-blur-md">
      {/* Perforated edge effect */}
      <div className="absolute -left-3 top-10 h-6 w-6 rounded-full bg-[var(--background)] border-r-2 border-dashed border-[#8d99ae]" />
      <div className="absolute -right-3 top-10 h-6 w-6 rounded-full bg-[var(--background)] border-l-2 border-dashed border-[#8d99ae]" />

      <div className="mb-6 flex items-center justify-between border-b-2 border-dashed border-[#8d99ae] pb-4">
        <h2 className="font-bebas text-4xl tracking-wider text-[var(--color-primary)] dark:text-[#00a8b5]">
          {title}
        </h2>
        <button
          onClick={() => router.push('/map')}
          className="rounded-full bg-gray-200 dark:bg-gray-700 p-1 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto font-mono text-sm text-[var(--foreground)]">
        {type === 'country' && data && (
          <div className="space-y-6">
            <div className="text-8xl text-center">{data.flag}</div>
            
            <div className="border border-dashed border-[#8d99ae] p-4 rounded-md">
              <h3 className="mb-4 font-bebas text-2xl tracking-wider text-[var(--color-primary)] dark:text-[#ffcd42]">QUICK FACTS</h3>
              <div className="grid grid-cols-2 gap-y-3">
                <span className="text-[#8d99ae]">Capital:</span>
                <span className="text-right">{data.capital}</span>
                <span className="text-[#8d99ae]">Population:</span>
                <span className="text-right">{data.population.toLocaleString()}</span>
                <span className="text-[#8d99ae]">Region:</span>
                <span className="text-right">{data.region}</span>
              </div>
            </div>
            
            <div className="border border-dashed border-[#8d99ae] p-4 rounded-md">
                <h3 className="mb-4 font-bebas text-2xl tracking-wider text-[var(--color-primary)] dark:text-[#ffcd42]">NEIGHBORS</h3>
                <div className="flex flex-wrap gap-2">
                    {/* Placeholder for neighbors */}
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
