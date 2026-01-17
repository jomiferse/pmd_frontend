import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { baseMetadata } from "./lib/seo/metadata";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  ...baseMetadata,
  manifest: "/favicons/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" }
    ],
    shortcut: "/favicons/favicon.ico",
    apple: [{ url: "/favicons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [
      { rel: "icon", url: "/favicons/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { rel: "icon", url: "/favicons/android-chrome-512x512.png", sizes: "512x512", type: "image/png" }
    ]
  },
  other: {
    "msapplication-config": "/favicons/browserconfig.xml",
    "msapplication-TileColor": "#eef2f6"
  }
};

export const viewport = {
  themeColor: "#eef2f6"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={spaceGrotesk.className}>
      <body>{children}</body>
    </html>
  );
}
