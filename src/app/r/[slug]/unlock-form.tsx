"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { unlockRegistry } from "@/app/actions/guest";
import { useTr } from "@/components/lang";
import { Button } from "@/components/ui/button";
import { errorText } from "@/lib/result";

export function UnlockForm({ slug }: { slug: string }) {
  const tr = useTr();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="card mt-6 p-5 text-left"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const res = await unlockRegistry(slug, password);
          if (!res.ok) setError(errorText(res.error, tr));
          else router.refresh();
        });
      }}
    >
      <label className="block">
        <span className="label">{tr("Password", "पासवर्ड")}</span>
        <input className="input h-14 text-center text-xl tracking-wide" value={password} onChange={(e) => setPassword(e.target.value)} autoCapitalize="none" autoComplete="off" autoFocus />
      </label>
      {error && <p className="mt-3 text-[15px] font-semibold text-red-700" role="alert">{error}</p>}
      <Button type="submit" size="lg" block className="mt-4" loading={pending} disabled={!password.trim()}>
        {tr("Open registry", "रजिस्ट्री खोलें")}
      </Button>
    </form>
  );
}
