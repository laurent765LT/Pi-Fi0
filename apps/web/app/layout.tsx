import './globals.css';
import { Providers } from './providers';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: {
    default: "Strick'in — Plateforme B2B de distribution",
    template: "%s | Strick'in",
  },
  description:
    "Strick'in est la plateforme B2B de référence pour la distribution de produits structurés. Marketplace dédiée aux CGP, assureurs et institutionnels pour souscrire, comparer et piloter des autocalls, produits à capital garanti et solutions d'assurance-vie en architecture ouverte.",
  keywords: [
    'produits structurés',
    'CGP',
    'assurance-vie',
    'autocall',
    'plateforme B2B',
    'distribution',
    'marketplace financière',
    'capital garanti',
    'produits dérivés',
    'MIF2',
    'architecture ouverte',
    'gestion de patrimoine',
    'investissement',
    'sous-jacent',
    'barrière de protection',
  ],
  openGraph: {
    type: 'website',
    title: "Strick'in — Plateforme B2B de distribution de produits structurés",
    description:
      "Marketplace dédiée aux CGP, assureurs et institutionnels pour souscrire, comparer et piloter des produits structurés en architecture ouverte.",
    siteName: "Strick'in",
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
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
      <body className="font-body bg-surface text-ink antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-violet focus:text-white focus:rounded-lg focus:shadow-lg"
        >
          Aller au contenu principal
        </a>
        <Providers>{children}</Providers>
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
