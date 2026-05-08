import {NextRequest, NextResponse} from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';

import {routing} from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

export default function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;

  // 1. Exclude public files and API routes (handled by matcher)
  // 2. Check if the path is explicitly prefixed with a locale
  const isPrefixed = routing.locales.some(locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`);
  
  if (isPrefixed) {
    return intlMiddleware(request);
  }

  // 3. Clean URL logic: Check for cookie, otherwise use default intl logic for detection
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  const locale = cookieLocale && routing.locales.includes(cookieLocale as any) 
    ? cookieLocale 
    : routing.defaultLocale;

  // Rewrite to the prefixed route so the user stays on the clean URL
  const newUrl = new URL(`/${locale}${pathname === '/' ? '' : pathname}`, request.url);
  return NextResponse.rewrite(newUrl);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
