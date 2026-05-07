'use client';

import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';

import { Skeleton } from '@/components/ui/Skeleton';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/Table';
import { Link } from '@/i18n/routing';
import { getLocalizedCountryName } from '@/lib/i18n-utils';
import { Country } from '@/types';

interface CountryDetailsClientProps {
  country: Country;
}

export default function CountryDetailsClient({ country }: CountryDetailsClientProps) {
  const t = useTranslations('CountryDetails');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const infoRows = [
    { label: t('labels.capital'), value: country.capital },
    { label: t('labels.largestCity'), value: country.largest_city },
    { label: t('labels.languages'), value: country.official_language },
    { label: t('labels.demonym'), value: country.demonym },
    { label: t('labels.government'), value: country.government },
    { label: t('labels.area'), value: `${country.area_km2.toLocaleString(locale)} km²` },
    { label: t('labels.population'), value: country.population.toLocaleString(locale) },
    { label: t('labels.gdp'), value: country.GDP },
    { label: t('labels.hdi'), value: country.HDI },
    { label: t('labels.currency'), value: country.currency },
    { label: t('labels.timeZone'), value: country.time_zone },
    { label: t('labels.callingCode'), value: country.calling_code },
    { label: t('labels.isoCode'), value: country.ISO_code },
  ];

  const countryName = getLocalizedCountryName(country.ISO_code, locale);

  return (
    <div className="flex min-h-screen flex-col">
      <main className={`container-custom mt-8 mb-20 flex-grow px-4 transition-opacity duration-500 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Top Section (Hero) */}
        <div className="mb-12 flex items-center gap-6">
          <Link href="/map" className="hover:text-primary p-2 text-gray-500 transition-colors">
            <ArrowLeft size={24} strokeWidth={1.5} />
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-[40px] font-medium tracking-tight text-[#2c3e50]">{countryName}</h1>
            <div className="relative h-10 w-16">
              <Image 
                src={country.flagUrl} 
                alt={`${countryName} flag`}
                fill
                className="rounded object-cover shadow-sm"
                onLoad={() => setIsImageLoaded(true)}
              />
              {!isImageLoaded && <Skeleton className="h-10 w-16" />}
            </div>
          </div>
        </div>

        {/* Bottom Section (Grid) */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          
          {/* Left Content (Summary) */}
          <section className="lg:col-span-8">
            <h2 className="mb-6 text-[15px] font-bold tracking-[0.2em] text-[#2c3e50] uppercase">
              {t('summary')}
            </h2>
            <p className="text-justify text-[15px] leading-[1.8] font-light text-gray-600">
              {country.description}
            </p>
          </section>

          {/* Right Content (Information Table) */}
          <section className="lg:col-span-4">
            <h2 className="mb-6 text-[15px] font-bold tracking-[0.2em] text-[#2c3e50] uppercase">
              {t('information')}
            </h2>
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <Table>
                <TableBody>
                  {infoRows.map((row) => (
                    <TableRow key={row.label} className="border-none">
                      <TableCell className="px-0 py-2.5 text-[11px] font-semibold tracking-widest whitespace-nowrap text-[#2c3e50] uppercase">
                        {row.label}
                      </TableCell>
                      <TableCell className="px-0 py-2.5 text-right text-[13px] font-light text-gray-500">
                        {row.value || tCommon('na')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
