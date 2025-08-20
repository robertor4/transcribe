import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { locales, defaultLocale } from '@/i18n.config';

export default async function RootPage() {
  // Get the Accept-Language header to detect user's preferred language
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || '';
  
  // Parse the Accept-Language header
  const languages = acceptLanguage.split(',').map(lang => {
    const [code] = lang.trim().split(';');
    return code.toLowerCase();
  });
  
  // Find the first matching locale
  let detectedLocale = defaultLocale;
  for (const lang of languages) {
    const langCode = lang.split('-')[0];
    if (locales.includes(langCode as typeof locales[number])) {
      detectedLocale = langCode as typeof defaultLocale;
      break;
    }
  }
  
  // Redirect to the detected locale
  redirect(`/${detectedLocale}`);
}