import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale } from '../i18n.config';

export default getRequestConfig(async ({ locale }) => {
  // Ensure locale is always a string
  const currentLocale = locale || defaultLocale;
  
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(currentLocale as any)) {
    return {
      locale: defaultLocale,
      messages: (await import(`../messages/${defaultLocale}.json`)).default
    };
  }

  try {
    // Try to load the messages for the requested locale
    const messages = (await import(`../messages/${currentLocale}.json`)).default;
    return {
      locale: currentLocale,
      messages
    };
  } catch (error) {
    // If there's an error loading the messages, fall back to default locale
    console.error(`Failed to load messages for locale ${currentLocale}, falling back to ${defaultLocale}:`, error);
    return {
      locale: defaultLocale,
      messages: (await import(`../messages/${defaultLocale}.json`)).default
    };
  }
});