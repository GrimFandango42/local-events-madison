// Root layout for Local Events platform
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Local Events - Madison Event Discovery',
  description: 'Discover food, music, and cultural events in Madison, Wisconsin without Facebook tracking',
  keywords: ['Madison events', 'Wisconsin events', 'local events', 'food events', 'music events', 'cultural events'],
  authors: [{ name: 'Local Events Platform' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <div className="min-h-full">
          {children}
        </div>
      </body>
    </html>
  );
}