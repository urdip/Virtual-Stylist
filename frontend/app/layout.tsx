import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../src/lib/auth-context";

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Virtual Stylist - AI-Powered Fashion",
  description: "Try on any outfit with AI. Upload your clothes and see how they look on you instantly.",
  keywords: ["AI", "fashion", "virtual try-on", "stylist", "wardrobe"],
  authors: [{ name: "Virtual Stylist" }],
  openGraph: {
    title: "Virtual Stylist",
    description: "Try on any outfit with AI",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#f5f3f0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
