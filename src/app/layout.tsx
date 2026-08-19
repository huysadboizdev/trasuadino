import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";
import { FloatingContact } from "@/components/ui/FloatingContact";

export const metadata: Metadata = {
  title: "Trà Sữa Dino - Uống là mê, Ăn là ghiền",
  description: "Web bán trà sữa, bánh ngọt & đồ ăn vặt",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#824031",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-[#f7f5f0] text-neutral-900 antialiased selection:bg-brand-500 selection:text-white">
        <ToastProvider>
          <AuthProvider>
            {children}
            <FloatingContact />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
