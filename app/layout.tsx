import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vexa Platform",
  description: "Property and Vehicle Marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <Header />
          <main className="min-h-screen bg-slate-50 text-vexa-blue pb-16 md:pb-0">
            {children}
          </main>
          <MobileNav />
          <div className="hidden md:block">
            <Footer />
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}