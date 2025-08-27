import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { headers } from 'next/headers';
import { Inter } from "next/font/google";
import "../../globals.css";

const inter = Inter({ subsets: ["latin"] });

export default async function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the user's preferred language from Accept-Language header
  // or default to 'en'
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || '';
  
  // Simple language detection - just check for common language codes
  let locale = 'en'; // default
  if (acceptLanguage.includes('nl')) locale = 'nl';
  else if (acceptLanguage.includes('de')) locale = 'de';
  else if (acceptLanguage.includes('fr')) locale = 'fr';
  else if (acceptLanguage.includes('es')) locale = 'es';
  
  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}