import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import { IconSprite } from "@/components/Icon";
import "./globals.css";

const urbanist = Urbanist({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-urbanist" });

export const metadata: Metadata = {
  title: "Marketcap",
  description: "Live prices, market news and your portfolio in one place.",
};

// Sets the theme before first paint so dark mode doesn't flash.
const themeScript = `try{var t=localStorage.getItem("marketcap-theme");document.documentElement.dataset.theme=t||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={urbanist.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <IconSprite />
        {children}
      </body>
    </html>
  );
}
