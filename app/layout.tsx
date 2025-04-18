import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "ImageNI",
  description: "AI Photo Generator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="dark">
      <head>
        {/* Add these scripts to properly load CloudPayments */}
        <script src="https://code.jquery.com/jquery-3.6.0.min.js" defer></script>
        {/* <script src="https://widget.cloudpayments.ru/bundles/cloudpayments.js" defer></script> */}
        <script src="https://checkout.cloudpayments.ru/checkout.js"></script>
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
