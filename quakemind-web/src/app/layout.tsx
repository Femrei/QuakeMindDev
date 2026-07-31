import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "QuakeMind - Afet İkaz & Operasyon Merkezi",
  description: "Afet müdahale destek sistemi, yapay zeka haritalama, uydu yol analizi ve acil durum yönetimi platformu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body className="bg-[#0b0f17] text-slate-100 antialiased min-h-screen flex flex-col selection:bg-red-500 selection:text-white">
        <AuthProvider>
          <Navbar />
          <div className="flex-1 flex overflow-hidden">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
