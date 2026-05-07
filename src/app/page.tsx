'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { routing } from '@/i18n/routing';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${routing.defaultLocale}`);
  }, [router]);

  return null;
}
