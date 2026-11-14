import type { Metadata, Viewport } from "next";
import { LangProvider } from "@/components/lang";
import { PwaRegister } from "@/components/pwa";
import { getLang } from "@/lib/i18n";
import { appUrl } from "@/lib/utils";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: "Giftr: Wedding gift registry & shagun, made for India", template: "%s · Giftr" },
  description:
    "Create your wedding gift registry in a minute. Share on WhatsApp, receive shagun by UPI, avoid duplicate gifts. Private by default. Hindi + English.",
  applicationName: "Giftr",
  appleWebApp: { capable: true, title: "Giftr", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/icons/192", sizes: "192x192" }], apple: "/icons/180" },
};

export const viewport: Viewport = {
  themeColor: "#9B1C31",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// The Vivah theme names these families; loading them by name keeps the theme the single source of truth.
const FONTS =
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Mukta:wght@400;500;600;700&display=swap";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body>
        <LangProvider lang={lang}>
          <Providers>{children}</Providers>
        </LangProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
