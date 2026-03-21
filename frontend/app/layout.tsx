import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope, Sora } from "next/font/google";

import { Providers } from "@/components/providers";

import "./globals.css";

const fontSans = Manrope({
  variable: "--font-sans",
  subsets: ["latin"]
});

const fontDisplay = Sora({
  variable: "--font-display",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "SignalForce",
  description: "Red social pseudonima de tesis de mercado con anclaje on-chain"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${fontSans.variable} ${fontDisplay.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
