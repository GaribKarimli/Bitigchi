import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "./client-layout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bitigchi — AI Stock Screener & Sentiment Analyzer",
  description:
    "Bitigchi reads chaotic market data, news, and social media, translating it into clear, actionable insights powered by FinBERT AI.",
  keywords: [
    "stock screener",
    "sentiment analysis",
    "finbert",
    "AI investing",
    "market intelligence",
  ],
  openGraph: {
    title: "Bitigchi — AI Market Intelligence",
    description: "AI-powered stock screening and sentiment analysis platform.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="min-h-screen antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
