import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/auth/AuthModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "야사장 (YASAJANG) | 비즈니스 멤버십 플랫폼",
  description: "검증된 비즈니스 리더들을 위한 프리미엄 멤버십 플랫폼 야사장입니다.",
  keywords: ["야사장", "비즈니스플랫폼", "멤버십", "야간비즈니스", "마케팅솔루션"],
  authors: [{ name: "Yasajang Team" }],
  openGraph: {
    title: "야사장 (YASAJANG) | 비즈니스 멤버십 플랫폼",
    description: "검증된 비즈니스 리더들을 위한 프리미엄 멤버십 플랫폼 야사장입니다.",
    type: "website",
    locale: "ko_KR",
  },
};

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
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-50">
        <Navbar />
        <main className="flex-grow pt-20">
          {children}
        </main>
        <Footer />
        {/* <AuthModal isOpen={false} onClose={() => {}} /> */}
      </body>
    </html>
  );
}
