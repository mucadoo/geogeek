'use client';

import { ArrowLeft, MapPin } from 'lucide-react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Skeleton } from '@/components/ui/Skeleton';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/Table';
import { Link, useRouter } from '@/i18n/routing';
import { getLocalizedCountryName } from '@/lib/i18n-utils';
import { countryService } from '@/lib/countryService';
import { useMapStore } from '@/store/useMapStore';
import { Country } from '@/types';

interface CountryDetailsClientProps {
  country: Country;
}

export default function CountryDetailsClient({ country }: CountryDetailsClientProps) {
  const t = useTranslations('CountryDetails');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const router = useRouter();
  const { setPosition } = useMapStore();
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const { data: neighbors = [] } = useQuery({
    queryKey: ['neighbors', country.name],
    queryFn: () => countryService.getNeighbors(country.name),
  });

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

  const handleViewOnMap = () => {
    // Basic mapping: this would ideally come from a coordinate service
    // For now, we'll set a standard zoom and reset position
    setPosition({ coordinates: [0, 20], zoom: 4 }); 
    router.push('/map');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <main className={`container-custom mt-8 mb-20 flex-grow px-4 transition-opacity duration-500 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}>
        
        <div className="mb-12 flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
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
          <button 
            onClick={handleViewOnMap}
            className="flex items-center gap-2 rounded-full bg-[#2c3e50] px-6 py-3 text-white transition-transform hover:scale-105"
          >
            <MapPin size={18} />
            {t('viewOnMap')}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          
          <section className="lg:col-span-8">
            <h2 className="mb-6 text-[15px] font-bold tracking-[0.2em] text-[#2c3e50] uppercase">
              {t('summary')}
            </h2>
            <p className="mb-10 text-justify text-[15px] leading-[1.8] font-light text-gray-600">
              {country.description}
            </p>

            {neighbors.length > 0 && (
              <>
                <h3 className="mb-6 text-[15px] font-bold tracking-[0.2em] text-[#2c3e50] uppercase">
                  {t('neighboringCountries')}
                </h3>
                <div className="flex flex-wrap gap-4">
                  {neighbors.map(neighbor => (
                    <Link 
                      key={neighbor.ISO_code}
                      href={`/country/${neighbor.ISO_code.toLowerCase()}`}
                      className="relative h-12 w-20 overflow-hidden rounded border border-gray-100 shadow-sm transition-transform hover:scale-110"
                      title={neighbor.name}
                    >
                      <Image 
                        src={neighbor.flagUrl} 
                        alt={neighbor.name}
                        fill
                        className="object-cover"
                      />
                    </Link>
                  ))}
                </div>
              </>
            )}
          </section>

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
