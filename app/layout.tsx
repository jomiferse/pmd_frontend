import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import type { ReactNode } from "react";
import { baseMetadata } from "./lib/seo/metadata";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"]
});

export const metadata = baseMetadata;

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
