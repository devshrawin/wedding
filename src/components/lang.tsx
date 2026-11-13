"use client";

import { createContext, useCallback, useContext, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/utils";
import { cn } from "@/lib/utils";

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

export function LangToggle({ className }: { className?: string }) {
  const lang = useLang();
  const router = useRouter();
  const [pending, start] = useTransition();
  const set = (next: Lang) => {
    if (next === lang) return;
    document.cookie = `giftr_lang=${next}; path=/; max-age=31536000; samesite=lax`;
    start(() => router.refresh());
  };
  return (
    <div
      role="group"
      aria-label="Language"
      className={cn(
        "inline-flex h-10 items-center rounded-full border border-line bg-white/80 p-1 text-sm font-semibold",
        pending && "opacity-60",
        className,
      )}
    >
      {(["en", "hi"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => set(l)}
          aria-pressed={lang === l}
          className={cn(
            "h-8 min-w-11 rounded-full px-3 transition-colors",
            lang === l ? "bg-primary text-white" : "text-muted hover:text-ink",
          )}
        >
          {l === "en" ? "EN" : "हिं"}
        </button>
      ))}
    </div>
  );
}
