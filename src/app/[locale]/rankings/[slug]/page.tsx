import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';


import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { RANKING_CATEGORIES, getRankingBySlug } from '@/config/rankingsConfig';
import { Link, routing } from '@/i18n/routing';
import { countryService } from '@/lib/countryService';
import { getLocalizedCountryName } from '@/lib/i18n-utils';

type RankingCategorySlug = 'most-populous-countries' | 'less-populous-countries' | 'larger-countries' | 'smaller-countries' | 'most-populated-countries' | 'less-populated-countries' | 'highest-hdi' | 'lowest-hdi';

export function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  routing.locales.forEach(locale => {
    RANKING_CATEGORIES.forEach(category => {
      params.push({ locale, slug: category.slug });
    });
  });
  return params;
}

export default async function RankingDetail({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const category = getRankingBySlug(slug);

  if (!category) {
    notFound();
  }
  
  const rankings = await countryService.getRankings(category.title);
  const t = await getTranslations('Rankings');

  let valueLabel = t('table.value');
  if (category.title.includes('populous')) valueLabel = t('table.population');
  if (category.title.includes('Larger') || category.title.includes('Smaller')) valueLabel = t('table.area');
  if (category.title.includes('populated')) valueLabel = t('table.density');
  if (category.title.includes('HDI')) valueLabel = t('table.hdi');

  return (
    <main className="container-custom animate-in fade-in mt-10 mb-20 flex-grow duration-1000">
      
      <div className="relative mx-auto mb-12 w-full max-w-[800px] text-center">
        <Link href="/rankings" className="hover:text-primary absolute top-1/2 left-0 -translate-y-1/2 p-2 text-gray-500 transition-colors">
          <ArrowLeft size={24} strokeWidth={1.5} />
        </Link>
        <h1 className="text-[32px] font-medium tracking-tight text-[#2c3e50]">{t(`categories.${slug as RankingCategorySlug}`)}</h1>
      </div>


      <div className="mx-auto max-w-[800px] rounded-3xl border border-gray-100 bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20 text-center">{t('table.rank')}</TableHead>
              <TableHead className="pl-4">{t('table.country')}</TableHead>
              <TableHead className="pr-4 text-right">{valueLabel}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankings.map((item, index) => (
              <TableRow key={item.isoCode}>
                <TableCell className="text-center font-semibold text-gray-400">
                  {index + 1}
                </TableCell>
                <TableCell className="pl-4">
                  <Link href={`/country/${item.isoCode}` as any} className="hover:text-primary text-[16px] font-medium text-[#2c3e50] transition-colors">
                    {getLocalizedCountryName(item.isoCode, locale)}
                  </Link>
                </TableCell>
                <TableCell className="pr-4 text-right font-light text-gray-500">
                  {item.value ? item.value.toLocaleString(locale) : t('table.na')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
