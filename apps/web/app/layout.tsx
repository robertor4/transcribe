import { ReactNode } from 'react';
import "./globals.css";
import { ThemeColor } from "@/components/ThemeColor";

// Geist font is loaded via Google Fonts CDN for the entire application

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
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: 'Geist, system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}