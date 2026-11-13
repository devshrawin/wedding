import { redirect } from "next/navigation";
import { Logo } from "@/components/brand";
import { LangToggle } from "@/components/lang";
import { getUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

function safeNext(next: string | undefined): string {
  return next && /^\/(?!\/)[\w\-/?=&%.]*$/.test(next) ? next : "/dashboard";
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getUser()) redirect(next);
  return (
    <div className="bg-festive min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Logo />
        <LangToggle />
      </header>
      <main className="mx-auto max-w-md px-5 pb-16 pt-6">
        <LoginForm next={next} />
      </main>
    </div>
  );
}
