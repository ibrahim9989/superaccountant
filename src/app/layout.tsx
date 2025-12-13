import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import ConditionalHeader from "@/components/ConditionalHeader";
import SiteFooter from "@/components/SiteFooter";
import ToastContainer from "@/components/Toast";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Super Accountant - Professional Accounting Certification",
  description: "Become a certified Super Accountant with our comprehensive 45-day course",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body
        className="font-sans antialiased"
      >
        <AuthProvider>
          <ConditionalHeader />
          {children}
          <SiteFooter />
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  );
}
