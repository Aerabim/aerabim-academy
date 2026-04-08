import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { PromoBanner } from "@/components/promotions/PromoBanner";
import { PromoPopup } from "@/components/promotions/PromoPopup";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://academy.aerabim.it';

export const metadata: Metadata = {
  title: {
    default:  'AerACADEMY | Formazione BIM Professionale',
    template: '%s | AerACADEMY',
  },
  description:
    'Piattaforma e-learning di AERABIM per la formazione professionale BIM/AEC. Corsi per professionisti tecnici e Pubblica Amministrazione.',
  metadataBase: new URL(APP_URL),
  openGraph: {
    type:        'website',
    siteName:    'AerACADEMY',
    title:       'AerACADEMY | Formazione BIM Professionale',
    description: 'Corsi BIM/AEC per professionisti tecnici e Pubblica Amministrazione. Formazione certificata da AERABIM S.R.L.',
    url:         APP_URL,
    locale:      'it_IT',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'AerACADEMY | Formazione BIM Professionale',
    description: 'Corsi BIM/AEC per professionisti tecnici e Pubblica Amministrazione.',
  },
  robots: {
    index:  true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className={`${outfit.variable} ${jakarta.variable} font-sans antialiased`}>
        <PromoBanner />
        <PromoPopup />
        {children}
      </body>
    </html>
  );
}
