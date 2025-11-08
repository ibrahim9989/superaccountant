import type { Metadata } from "next";
import { Space_Grotesk, Bodoni_Moda } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const raleway = Space_Grotesk({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const display = Bodoni_Moda({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Super Accountant - Professional Accounting Certification",
  description: "Become a certified Super Accountant with our comprehensive 45-day course",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${raleway.variable} ${display.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
