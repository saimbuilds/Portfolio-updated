// import type { Metadata } from "next";
// import "./globals.css";
// import "./becoming.css";
// import "./ledger.css";

import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./becoming.css";
import "./ledger.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};


export const metadata: Metadata = {
  title: "Muhammad Saim | Product Instinct in Motion",
  description: "A living portfolio of product thinking, pitching, building and the daily work behind it.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Muhammad Saim | Product Instinct in Motion",
    description: "I think in products. I pitch them into motion. Follow the work as it happens.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
