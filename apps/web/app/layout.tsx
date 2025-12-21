import { ReactNode } from 'react';
import "./globals.css";
import { ThemeColor } from "@/components/ThemeColor";

// Dual-font system: Geist for body text, Montserrat for headings (capitalized)

type Props = {
  children: ReactNode;
};

// Root layout required for error pages (404, 500, etc.)
export default function RootLayout({ children }: Props) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeColor />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Montserrat:wght@500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: 'Geist, system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}