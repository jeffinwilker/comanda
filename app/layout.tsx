import type { Metadata } from "next";
import { Space_Grotesk, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./auth-context";
import { PwaRegister } from "./pwa-register";
import { AlertHost } from "./alert-host";

const bodyFont = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Comanda - Sistema de Gestão",
  description: "Sistema de comanda eletrônica para restaurantes",
  manifest: "/manifest.webmanifest",
  themeColor: "#db4c1e",
  appleWebApp: {
    title: "Comanda",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} antialiased`}>
        <AuthProvider>
          {children}
          <PwaRegister />
          <AlertHost />
        </AuthProvider>
      </body>
    </html>
  );
}

