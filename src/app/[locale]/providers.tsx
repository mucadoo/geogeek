'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider, AbstractIntlMessages } from 'next-intl';
import { useEffect, useState } from 'react';

import { useUserStore } from '@/store/useUserStore';

export default function Providers({
  children,
  messages,
  locale
}: {
  children: React.ReactNode;
  messages: AbstractIntlMessages;
  locale: string;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const hydrate = useUserStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <NextIntlClientProvider messages={messages} locale={locale} timeZone="UTC">
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </NextIntlClientProvider>
  );
}
