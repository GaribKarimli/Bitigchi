"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <LanguageProvider>
        <div className="flex">
          <Sidebar />
          <div className="pl-64 flex-1 flex flex-col min-h-screen transition-all duration-300">
            <Navbar />
            <main className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
              {children}
            </main>
          </div>
        </div>
      </LanguageProvider>
    </AuthProvider>
  );
}
