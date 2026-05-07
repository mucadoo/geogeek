'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider, AbstractIntlMessages } from 'next-intl';
import { useState } from 'react';

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

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </NextIntlClientProvider>
  );
}
