import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: "Strick'in — Plateforme B2B de distribution",
  description:
    "Plateforme de distribution de produits structurés pour assureurs institutionnels",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="font-body bg-surface text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
