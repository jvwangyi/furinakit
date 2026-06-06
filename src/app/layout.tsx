import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { BackToTop } from "@/components/layout/BackToTop";
import { Providers } from "@/components/providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { StarryBackground } from "@/components/StarryBackground";
import { withBasePath } from "@/lib/basePath";

export const metadata: Metadata = {
  title: "FurinaKit - Furina's Toolbox",
  description: "An elegant online toolbox with 80+ practical tools for PDF, image, text, audio, video processing and more. Free, fast, no signup required.",
  icons: {
    icon: withBasePath("/furina.jpg"),
    apple: withBasePath("/furina.jpg"),
  },
  openGraph: {
    title: "FurinaKit - Furina's Toolbox",
    description: "An elegant online toolbox with 80+ practical tools for PDF, image, text, audio, video processing and more.",
    url: "https://furinakit.example.com",
    siteName: "FurinaKit",
    locale: "zh_CN",
    type: "website",
    images: [
      {
        url: withBasePath("/furina.jpg"),
        width: 512,
        height: 512,
        alt: "FurinaKit Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FurinaKit - Furina's Toolbox",
    description: "An elegant online toolbox with 80+ practical tools.",
    images: [withBasePath("/furina.jpg")],
  },
  other: {
    "theme-color": "#3b82f6",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "FurinaKit",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <StarryBackground />
        <Providers>
          <ErrorBoundary>
            <MobileNav />
            <BackToTop />
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 overflow-auto pt-0 lg:pt-0">
                {children}
              </main>
            </div>
          </ErrorBoundary>
        </Providers>
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('${withBasePath('/sw.js')}').catch(() => {});
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
