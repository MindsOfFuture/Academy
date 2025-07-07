import type { Metadata } from "next";
import { Comfortaa } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import Navbar from "@/components/navbar/navbar";
import Aurora from "@/components/aurora/aurora";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
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
      <body className={`${comfortaa.className} antialiased tracking-[-1.5px]`}>
        <Aurora
          colorStops={["#684A97", "#FFD300", "#684A97"]}
          blend={1.0}
          amplitude={0.3}
          speed={1}
        />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
