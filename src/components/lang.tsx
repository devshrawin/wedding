"use client";

import { createContext, useCallback, useContext, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import type { Lang } from "@/lib/utils";

const LangContext = createContext<Lang>("en");

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang(): Lang {
  return useContext(LangContext);
}

export function useTr() {
  const lang = useContext(LangContext);
  return useCallback((en: string, hi: string) => (lang === "hi" ? hi : en), [lang]);
}

export function LangToggle() {
  const lang = useLang();
  const router = useRouter();
  const [pending, start] = useTransition();
  const set = (next: string) => {
    if (next === lang) return;
    document.cookie = `giftr_lang=${next}; path=/; max-age=31536000; samesite=lax`;
    start(() => router.refresh());
  };
  return (
    <span className={pending ? "opacity-60" : undefined}>
      <SegmentedControl label="Language / भाषा" value={lang} onChange={set} size="sm">
        <SegmentedControlItem value="en" label="EN" />
        <SegmentedControlItem value="hi" label="हिं" />
      </SegmentedControl>
    </span>
  );
}
