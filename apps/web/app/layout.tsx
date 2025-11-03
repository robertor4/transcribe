import { ReactNode } from 'react';
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeColor } from "@/components/ThemeColor";

const inter = Inter({ subsets: ["latin"] });

type Props = {
  children: ReactNode;
};

// Root layout required for error pages (404, 500, etc.)
export default function RootLayout({ children }: Props) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeColor />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}