import {NextRequest, NextResponse} from 'next/server';
import {routing} from './i18n/routing';
import {match} from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

export default function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;

  // 1. Check if the path is already prefixed with a locale
  const isPrefixed = routing.locales.some(locale => pathname.startsWith(`/${locale}/`));
  if (isPrefixed) return NextResponse.next();

  // 2. Language detection and memory logic
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  let locale = cookieLocale;

  if (!locale) {
    const languages = new Negotiator({
      headers: { 'accept-language': request.headers.get('accept-language') || '' }
    }).languages();
    locale = match(languages, routing.locales, routing.defaultLocale);
  }

  // 3. For default locale, keep clean URLs (as-needed strategy)
  if (locale === routing.defaultLocale) {
    return NextResponse.next();
  }

  // 4. Internal rewrite to the prefixed [locale] path to keep URL clean for user
  const newUrl = new URL(`/${locale}${pathname}`, request.url);
  return NextResponse.rewrite(newUrl);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
