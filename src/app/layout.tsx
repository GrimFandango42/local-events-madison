// Root layout for Local Events platform
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ErrorBoundary from '@/components/ErrorBoundary';
import ServiceWorkerProvider from '@/components/ServiceWorkerProvider';
import PerformanceMonitor from '@/components/PerformanceMonitor';
import SessionProvider from '@/components/SessionProvider';

// Optimized font loading with display: swap for better performance
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial']
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#2563eb',
};

export const metadata: Metadata = {
  title: {
    default: 'Local Events - Madison Event Discovery',
    template: '%s | Local Events Madison'
  },
  description: 'Discover food, music, and cultural events in Madison, Wisconsin without Facebook tracking. Privacy-focused event aggregation from local venues.',
  keywords: [
    'Madison events', 'Wisconsin events', 'local events', 'food events', 
    'music events', 'cultural events', 'Madison Wisconsin', 'event discovery',
    'privacy-focused', 'Facebook alternative', 'local venues'
  ],
  authors: [{ name: 'Local Events Platform' }],
  creator: 'Local Events Platform',
  publisher: 'Local Events Platform',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('http://localhost:3001'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'http://localhost:3001',
    title: 'Local Events - Madison Event Discovery',
    description: 'Discover food, music, and cultural events in Madison, Wisconsin without Facebook tracking',
    siteName: 'Local Events Madison',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Local Events - Madison Event Discovery',
    description: 'Privacy-focused event discovery for Madison, Wisconsin',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Preconnect to external domains for better performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* DNS prefetch for known domains */}
        <link rel="dns-prefetch" href="//localhost" />
        {/* Favicon and PWA */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.className} h-full antialiased`}>
        <SessionProvider>
        <ServiceWorkerProvider>
          <ErrorBoundary>
            <div className="min-h-full">
              {children}
            </div>
          </ErrorBoundary>
          <PerformanceMonitor />
        </ServiceWorkerProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
