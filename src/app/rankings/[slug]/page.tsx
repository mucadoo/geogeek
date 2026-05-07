import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { RANKING_CATEGORIES, getRankingBySlug } from '@/config/rankingsConfig';
import { countryService } from '@/lib/countryService';

export function generateStaticParams() {
  return RANKING_CATEGORIES.map((category) => ({
    slug: category.slug,
  }));
}

export default async function RankingDetail({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const category = getRankingBySlug(slug);

  if (!category) {
    notFound();
  }
  
  const rankings = await countryService.getRankings(category.title);

  let valueLabel = 'Value';
  if (category.title.includes('populous')) valueLabel = 'Population';
  if (category.title.includes('Larger') || category.title.includes('Smaller')) valueLabel = 'Area (km²)';
  if (category.title.includes('populated')) valueLabel = 'Pop Density (/km²)';
  if (category.title.includes('HDI')) valueLabel = 'HDI Score';

  return (
    <main className="container-custom animate-in fade-in mt-10 mb-20 flex-grow duration-1000">
      
      <div className="relative mx-auto mb-12 w-full max-w-[800px] text-center">
        <Link href="/rankings" className="hover:text-primary absolute top-1/2 left-0 -translate-y-1/2 p-2 text-gray-500 transition-colors">
          <ArrowLeft size={24} strokeWidth={1.5} />
        </Link>
        <h1 className="text-[32px] font-medium tracking-tight text-[#2c3e50]">{category.title}</h1>
      </div>

      <div className="mx-auto max-w-[800px] rounded-3xl border border-gray-100 bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20 text-center">Rank</TableHead>
              <TableHead className="pl-4">Country</TableHead>
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
                  <Link href={`/country/${item.isoCode}`} className="hover:text-primary text-[16px] font-medium text-[#2c3e50] transition-colors">
                    {item.country}
                  </Link>
                </TableCell>
                <TableCell className="pr-4 text-right font-light text-gray-500">
                  {item.value ? item.value.toLocaleString() : 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
