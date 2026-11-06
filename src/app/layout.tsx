import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/shell/Header";
import { Providers } from "@/components/shell/Providers";
import { SideNav } from "@/components/shell/SideNav";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Joel's Jira Dashboard",
  description: "A modern dashboard for Jira Cloud",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex h-full flex-col overflow-hidden font-sans">
        <Providers>
          <Header />
          <div className="flex min-h-0 flex-1">
            <SideNav />
            <main className="scroll-thin min-w-0 flex-1 overflow-y-auto">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
