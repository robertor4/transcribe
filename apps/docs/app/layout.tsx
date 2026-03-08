import './globals.css';
import { RootProvider } from 'fumadocs-ui/provider';
import { Montserrat } from 'next/font/google';
import type { ReactNode } from 'react';

const montserrat = Montserrat({ subsets: ['latin'] });

export const metadata = {
  title: {
    template: '%s | Neural Summary Docs',
    default: 'Neural Summary Docs',
  },
  description: 'Technical documentation for the Neural Summary platform.',
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={montserrat.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
