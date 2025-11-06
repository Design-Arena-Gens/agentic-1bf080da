import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Anonymous Broadcast Chat",
  description:
    "Drop instant anonymous messages to everyone online with a shared live feed.",
  metadataBase: new URL("https://agentic-1bf080da.vercel.app"),
  openGraph: {
    title: "Anonymous Broadcast Chat",
    description:
      "Send live anonymous messages that instantly reach everyone in the room.",
    url: "https://agentic-1bf080da.vercel.app",
    siteName: "Anonymous Broadcast",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anonymous Broadcast Chat",
    description:
      "Send live anonymous updates and see them sync instantly for everyone.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
