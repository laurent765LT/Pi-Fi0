import './globals.css';
import { Providers } from './providers';
import type { Metadata, Viewport } from 'next';

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: "Strick'in",
  url: 'https://strickin-web-web.vercel.app',
  logo: 'https://strickin-web-web.vercel.app/logo.png',
  description:
    'Plateforme B2B de distribution de produits financiers structurés pour CGP et assureurs',
  foundingDate: '2025',
  areaServed: { '@type': 'Country', name: 'France' },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: 'French',
    email: 'contact@strickin.fr',
  },
};

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: "Strick'in",
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: 'Essai gratuit 30 jours sans carte bancaire',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '150',
  },
};

export const metadata: Metadata = {
  metadataBase: new URL('https://strickin-web-web.vercel.app'),
  title: {
    default: "Strick'in — La marketplace des produits structurés",
    template: "%s | Strick'in",
  },
  description:
    "Plateforme B2B de distribution de produits structurés pour CGP et assureurs. Pricing temps réel, multi-émetteurs, conforme MIF2/DDA.",
  keywords: [
    'produits structurés',
    'CGP',
    'MIF2',
    'pricing',
    'autocall',
    'phoenix',
    'distribution',
    'assurance-vie',
    'plateforme B2B',
    'marketplace financière',
    'capital garanti',
    'produits dérivés',
    'architecture ouverte',
    'gestion de patrimoine',
    'investissement',
    'sous-jacent',
    'barrière de protection',
  ],
  authors: [{ name: "Strick'in" }],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: "Strick'in",
    title: "Strick'in — La marketplace B2B des produits structurés",
    description:
      'Plateforme B2B de distribution de produits structurés. Pricing temps réel, multi-émetteurs, conforme MIF2.',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: "Strick'in",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Strick'in — Marketplace B2B",
    description: 'Plateforme de distribution de produits structurés.',
    images: ['/og-image.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#3B1FA8',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-surface text-ink antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-violet focus:text-white focus:rounded-lg focus:shadow-lg"
        >
          Aller au contenu principal
        </a>
        <Providers>{children}</Providers>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareSchema),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && location.hostname !== 'localhost') {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
