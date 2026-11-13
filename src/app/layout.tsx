import type { Metadata, Viewport } from "next";
import { Fraunces, Mukta } from "next/font/google";
import { LangProvider } from "@/components/lang";
import { PwaRegister } from "@/components/pwa";
import { Toaster } from "@/components/ui/bits";
import { getLang } from "@/lib/i18n";
import { appUrl } from "@/lib/utils";
import "./globals.css";

const mukta = Mukta({ subsets: ["latin", "devanagari"], weight: ["400", "500", "600", "700"], variable: "--font-mukta", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-fraunces", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: "Giftr — Wedding gift registry & shagun, made for India", template: "%s · Giftr" },
  description:
    "Create your wedding gift registry in a minute. Share on WhatsApp, receive shagun by UPI, avoid duplicate gifts — private by default. Hindi + English.",
  applicationName: "Giftr",
  appleWebApp: { capable: true, title: "Giftr", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  icons: { icon: "/icons/192", apple: "/icons/180" },
};

export const viewport: Viewport = {
  themeColor: "#8c1d2f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} className={`${mukta.variable} ${fraunces.variable}`}>
      <body>
        <LangProvider lang={lang}>
          {children}
          <Toaster />
        </LangProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
