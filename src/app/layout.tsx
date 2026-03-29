import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Nav } from "@/components/nav";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "HalalVote — Is it Halal or Haram?",
  description: "Vote and discuss whether topics are Halal or Haram in the Muslim community.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${playfair.variable} ${inter.className} bg-neutral-950 text-white min-h-screen antialiased`}
      >
        <div className="geometric-bg min-h-screen flex flex-col">
          <Nav />
          <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
