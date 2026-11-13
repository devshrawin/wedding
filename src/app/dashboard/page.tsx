import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Plus } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { Logo } from "@/components/brand";
import { LangToggle } from "@/components/lang";
import { buttonClass } from "@/components/ui/button";
import { listManagedRegistries, requireUser } from "@/lib/auth";
import { getTr } from "@/lib/i18n";
import { formatDate, prettyPhone } from "@/lib/utils";

export const metadata = { title: "Your registries" };

export default async function DashboardHome() {
  const user = await requireUser("/dashboard");
  const registries = await listManagedRegistries(user);
  if (registries.length === 0) redirect("/new");
  if (registries.length === 1) redirect(`/dashboard/${registries[0].slug}`);
  const { tr, lang } = await getTr();

  return (
    <div className="bg-festive min-h-dvh">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
        <Logo />
        <LangToggle />
      </header>
      <main className="mx-auto max-w-2xl px-5 pb-16">
        <h1 className="text-3xl font-semibold">{tr("Your registries", "आपकी रजिस्ट्रियाँ")}</h1>
        <ul className="mt-6 space-y-3">
          {registries.map((r) => (
            <li key={r.id}>
              <Link href={`/dashboard/${r.slug}`} className="card flex items-center gap-4 p-5 hover:bg-sand/40">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-xl font-semibold">
                    {r.partnerOne} & {r.partnerTwo}
                  </p>
                  <p className="text-[15px] text-muted">
                    {[formatDate(r.weddingDate, lang), r.city].filter(Boolean).join(" · ") || tr("Date not set", "तारीख़ तय नहीं")}
                    {r.role === "family" && <span className="ml-2 rounded-full bg-leaf-soft px-2 py-0.5 text-xs font-bold text-leaf">{tr("Family", "परिवार")}</span>}
                  </p>
                </div>
                <ChevronRight className="size-5 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/new" className={buttonClass({ variant: "outline", block: true, className: "mt-4" })}>
          <Plus className="size-5" /> {tr("Create another registry", "एक और रजिस्ट्री बनाएँ")}
        </Link>
        <form action={logout} className="mt-10 text-center text-[15px] text-muted">
          {prettyPhone(user.phone)} ·{" "}
          <button className="h-11 font-semibold underline">{tr("Sign out", "लॉग आउट")}</button>
        </form>
      </main>
    </div>
  );
}
