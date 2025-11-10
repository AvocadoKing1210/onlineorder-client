import type { Metadata } from "next";
import { Inter, Playfair_Display, Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/lib/query-provider";
import { AuthProvider } from "@/lib/auth-provider";
import { config } from "@/lib/config";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "700"],
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: config.seo.title,
  description: config.seo.description,
  keywords: config.seo.keywords,
  authors: [{ name: config.seo.author }],
  icons: {
    icon: [
      { url: "/assets/icons/file.svg", type: "image/svg+xml", sizes: "any" },
    ],
    shortcut: [{ url: "/assets/icons/file.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: config.seo.openGraph.title,
    description: config.seo.openGraph.description,
    type: config.seo.openGraph.type as "website",
    locale: config.site.locale,
    siteName: config.seo.openGraph.siteName,
  },
  twitter: {
    card: config.seo.twitter.card as "summary_large_image",
    title: config.seo.twitter.title,
    description: config.seo.twitter.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: config.site.canonical,
  },
  other: {
    "geo.region": config.seo.geo.region,
    "geo.placename": config.seo.geo.placename,
    "ICBM": `${config.seo.geo.latitude}, ${config.seo.geo.longitude}`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={config.site.language} className={`${inter.variable} ${playfair.variable} ${geist.variable}`}>
      <head>
        <link rel="icon" type="image/svg+xml" sizes="any" href="/assets/icons/file.svg" />
      </head>
      <body className="font-sans antialiased">
        <QueryProvider>
          <AuthProvider>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

