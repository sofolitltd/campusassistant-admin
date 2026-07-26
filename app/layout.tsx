import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Campus Assistant Admin",
  description: "Administrative portal for Campus Assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} font-sans h-full antialiased`}>
      <body className="flex h-full overflow-hidden bg-background">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
