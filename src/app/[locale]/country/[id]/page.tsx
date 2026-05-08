import { redirect } from 'next/navigation';

export default async function RedirectToMap({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  redirect(`/${locale}/map/${id.toLowerCase()}`);
}
