"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { unlockRegistry } from "@/app/actions/guest";
import { useTr } from "@/components/lang";
import { errorText } from "@/lib/result";

export function UnlockForm({ slug }: { slug: string }) {
  const tr = useTr();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="mt-6 space-y-4"
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
      <TextInput
        label={tr("Password", "पासवर्ड")}
        width="100%"
        size="lg"
        value={password}
        onChange={setPassword}
        autoCapitalize="none"
        autoComplete="off"
        hasAutoFocus
        status={error ? { type: "error", message: error } : undefined}
        statusVariant="detached"
      />
      <Button type="submit" variant="primary" size="lg" width="100%" isLoading={pending} isDisabled={!password.trim()} label={tr("Open registry", "रजिस्ट्री खोलें")} />
    </form>
  );
}
