import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import { IconSprite } from "@/components/Icon";
import { AuthProvider } from "@/components/AuthProvider";
import { AlertsProvider } from "@/components/AlertsProvider";
import { SiteFooter } from "@/components/SiteFooter";
import { getAuth } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";
import "./globals.css";

const urbanist = Urbanist({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-urbanist" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: "Marketcap",
  description: "Live prices, market news and your portfolio in one place: US stocks, crypto, NGX and naira exchange rates.",
  openGraph: {
    type: "website",
    siteName: "Marketcap",
    title: "Marketcap",
    description: "Live prices, market news and your portfolio in one place.",
  },
  twitter: { card: "summary_large_image" },
};

// Sets the theme before first paint so dark mode doesn't flash.
const themeScript = `try{var t=localStorage.getItem("marketcap-theme");document.documentElement.dataset.theme=t||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getAuth();
  return (
    <html lang="en" className={urbanist.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <IconSprite />
        <AuthProvider user={user} profile={profile}>
          <AlertsProvider>{children}</AlertsProvider>
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
