import type { Metadata } from "next";
import { Newsreader, Hanken_Grotesk, JetBrains_Mono, Vazirmatn } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/layout/NavBar";

const serif = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
});
const sans = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});
const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-vazirmatn",
});

export const metadata: Metadata = {
  title: "Open Tutor",
  description: "Self-hosted interactive learning environment",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-accent="clay"
      data-corners="soft"
      className={`${serif.variable} ${sans.variable} ${mono.variable} ${vazirmatn.variable}`}
    >
      <body className="antialiased">
        <NavBar />
        {children}
      </body>
    </html>
  );
}
