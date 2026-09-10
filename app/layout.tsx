import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Geist এর বদলে Inter ফন্ট ব্যবহার করা হয়েছে
const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tawfik Mart - E-commerce", // আপনার ওয়েবসাইটের নাম দিন
  description: "Best online shopping in BD",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${inter.className} min-h-full flex flex-col`}>
        {children}
      </body>
    </html>
  );
}