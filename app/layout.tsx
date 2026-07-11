import type { Metadata } from 'next';
import { Cormorant_Garamond, Manrope, Hanken_Grotesk, Jost, Poppins, Caveat } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { Providers } from '@/providers/query-provider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';

const heading = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
});
const body = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});
// Fixed brand faces used by the mobile home + product cards + accents.
const pahserif = Cormorant_Garamond({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-pahserif', display: 'swap' });
const hanken = Hanken_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-hanken', display: 'swap' });
const jost = Jost({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-jost', display: 'swap' });
const poppins = Poppins({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-poppins', display: 'swap' });
const caveat = Caveat({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-caveat', display: 'swap' });

const fontVars = [heading, body, pahserif, hanken, jost, poppins, caveat].map((f) => f.variable).join(' ');

export const metadata: Metadata = {
  title: 'PlantAtHome — Bring Nature Home',
  description: 'Plants, pots and care, delivered from nurseries near you.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVars}>
      <body className="flex min-h-full flex-col">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
          <Toaster position="bottom-center" richColors toastOptions={{ style: { fontFamily: 'var(--font-body)' } }} />
        </Providers>
      </body>
    </html>
  );
}
