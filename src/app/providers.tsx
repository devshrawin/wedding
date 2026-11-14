"use client";

import Link from "next/link";
import { LinkProvider } from "@astryxdesign/core/Link";
import { Theme } from "@astryxdesign/core/theme";
import { ToastBridge } from "@/components/ui/feedback";
import { defaultThemeSlug, themes } from "../astryx-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // Light only for now: the festive palette and share cards are tuned for paper-white.
    <Theme theme={themes[defaultThemeSlug]} mode="light">
      <LinkProvider component={Link}>
        {children}
        <ToastBridge />
      </LinkProvider>
    </Theme>
  );
}
