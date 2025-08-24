import type { Metadata } from "next";
import { Comfortaa } from "next/font/google";
import "./globals.css";
import Aurora from "@/components/aurora/aurora";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Minds Academy",
  description: "Transforme seu aprendizado com os cursos online da Minds Academy. Aprenda Lógica de Programação, impressão 3d, LEGO Education SPIKE, Scratch e mais. Comece hoje e ganhe seu certificado!",
  keywords: [
    "Minds Academy",
    "Cursos online",
    "Lógica de Programação",
    "Impressão 3D",
    "LEGO Education SPIKE",
    "Scratch",
    "Certificados",
  ],
  openGraph: {
    title: "Minds Academy",
    description: "Transforme seu aprendizado com os cursos online da Minds Academy.",
    url: defaultUrl,
    siteName: "Minds Academy",
    images: [
      {
        url: `${defaultUrl}/logo.svg`,
        width: 1200,
        height: 630,
        alt: "Minds Academy - Transforme seu aprendizado",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Minds Academy",
    description: "Transforme seu aprendizado com os cursos online da Minds Academy.",
    images: [
      {
        url: `${defaultUrl}/logo.svg`,
        width: 1200,
        height: 630,
        alt: "Minds Academy - Transforme seu aprendizado",
      },
    ],
  },
  icons: {
    icon: "/logo_navbar.svg",
    shortcut: "/logo_navbar.svg",
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

const comfortaa = Comfortaa({
  weight: "700",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <body className={`${comfortaa.className} antialiased tracking-[0px]`}>
        <Aurora
          colorStops={["#684A97", "#FFD300", "#684A97"]}
          blend={1.0}
          amplitude={0.3}
          speed={1}
        />
        {children}
      </body>
    </html>
  );
}
