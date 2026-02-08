import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Orgeist is not standard, sticking to Inter or similar
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// Force Edge Runtime for Cloudflare Pages
export const runtime = 'edge';

export const metadata: Metadata = {
  title: "Man of the Match Voting",
  description: "Bình chọn cầu thủ xuất sắc nhất trận đấu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
