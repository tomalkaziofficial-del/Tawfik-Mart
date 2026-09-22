import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

// Geist এর বদলে Inter ফন্ট ব্যবহার করা হয়েছে
const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zeenat Mart | Premium Islamic Lifestyle",
  description: "বাংলাদেশের অন্যতম সেরা প্রিমিয়াম ইসলামিক লাইফস্টাইল এবং ফ্যাশন অনলাইন শপ।",
  openGraph: {
    title: "Zeenat Mart | Premium Islamic Lifestyle",
    description: "বাংলাদেশের অন্যতম সেরা প্রিমিয়াম ইসলামিক লাইফস্টাইল এবং ফ্যাশন অনলাইন শপ।",
    url: "https://zeenat-mart.com",
    siteName: "Zeenat Mart",
    images: [
      {
        url: "https://zeenat-mart.com/banner.jpg", 
        width: 1200,
        height: 630,
        alt: "Zeenat Mart Premium Collection",
      },
    ],
    locale: "bn_BD",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        {/* Meta Pixel Code */}
        <Script
          id="fb-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1121693230422858');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1121693230422858&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
      </head>
      <body className={`${inter.className} min-h-full flex flex-col`}>
        {children}
      </body>
    </html>
  );
}