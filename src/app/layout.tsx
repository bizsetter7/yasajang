import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Suspense } from "react";
import AuthModalWrapper from "@/components/auth/AuthModalWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * generateMetadata — P-12 SEO 마스터 표준 (B2B 간소화 적용)
 * 야사장은 B2B SaaS 특성상 WebSite 스키마만 적용. JobPosting은 P9/P10에서.
 *
 * Refs: PATTERNS/P-12_seo_master.md
 */
export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yasajang.kr';
  const isCloneSite =
    siteUrl.includes('d386') ||
    (siteUrl.includes('vercel.app') && !siteUrl.includes('yasajang'));

  if (isCloneSite) {
    return {
      title: '야사장',
      robots: {
        index: false,
        follow: false,
        googleBot: { index: false, follow: false },
      },
      alternates: { canonical: 'https://www.yasajang.kr' },
    };
  }

  let metadataBase: URL | null = null;
  try { metadataBase = new URL(siteUrl); }
  catch { metadataBase = new URL('https://www.yasajang.kr'); }

  const title = '야사장 (YASAJANG) | 유흥업소 사장님 전용 비즈니스 멤버십';
  const description = '유흥업소 사장님을 위한 프리미엄 멤버십 플랫폼. 입점 1회로 코코알바·웨이터존·선수존·밤길 4개 플랫폼 동시 노출.';
  const ogImage = `${siteUrl}/og-image.jpg`;

  return {
    metadataBase,
    title,
    description,
    keywords: ['야사장', '유흥업소', '비즈니스플랫폼', '멤버십', '야간비즈니스', '마케팅솔루션', '룸살롱사장', '노래주점사장', '입점광고'],
    authors: [{ name: 'Yasajang Team' }],
    verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION }
      : undefined,
    openGraph: {
      title,
      description,
      url: siteUrl,
      siteName: '야사장',
      images: [{ url: ogImage, width: 1200, height: 630, alt: '야사장 - 비즈니스 멤버십 플랫폼' }],
      type: 'website',
      locale: 'ko_KR',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    other: {
      google: 'notranslate',
      'geo.region': 'KR',
      'geo.placename': 'Seoul',
      'geo.position': '37.4979;127.0276',
      'ICBM': '37.4979, 127.0276',
      'robots': 'max-image-preview:large',
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-50 notranslate">
        {/* JSON-LD WebSite + SearchAction — P-12 SEO 표준 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              'name': '야사장',
              'alternateName': 'YASAJANG',
              'url': 'https://www.yasajang.kr',
              'description': '유흥업소 사장님 전용 비즈니스 멤버십 플랫폼',
            }),
          }}
        />
        <Navbar />
        <main className="flex-grow pt-20">
          {children}
        </main>
        <Footer />
        <Suspense><AuthModalWrapper /></Suspense>
      </body>
    </html>
  );
}
