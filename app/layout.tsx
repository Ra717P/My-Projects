// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Providers } from "@/components/Providers";
import { Poppins, Dancing_Script } from "next/font/google";

// Font setup
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});

const dancing = Dancing_Script({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-dancing",
  display: "swap",
});

// Metadata
export const metadata: Metadata = {
  title: "Sisi Kopi | Pemesanan Menu Café",
  description: "Website pemesanan menu café Sisi Kopi secara online.",
  icons: { icon: "/favicon.ico" },
};

// Viewport (dipisah sesuai aturan Next.js)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FFF8E7",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${poppins.variable} ${dancing.variable}`}>
      <body
        className={`${poppins.className} min-h-dvh bg-[#FFF8E7] text-gray-800`}
      >
        <Providers>
          {/* Header */}
          <header>
            <Navbar />
          </header>

          {/* 
            Wrapper responsif untuk seluruh halaman:
            - px-4: padding nyaman di HP
            - sm:px-6 lg:px-8: padding lebih longgar di layar besar
            - max-w-7xl mx-auto: lebar konten dibatasi rapi di desktop
            - py-4 sm:py-6: jarak vertikal konsisten
          */}
          <main className="min-h-dvh px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl mx-auto">
            {children}
          </main>

          {/* Footer */}
          <footer className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <Footer />
          </footer>
        </Providers>
      </body>
    </html>
  );
}
