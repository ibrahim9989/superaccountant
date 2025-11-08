import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
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
        className={`${raleway.variable} font-sans antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
