import { redirect } from "next/navigation";
import { PageShell } from "@/components/page-shell";
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
    <PageShell>
      <div className="pt-4">
        <LoginForm next={next} />
      </div>
    </PageShell>
  );
}
