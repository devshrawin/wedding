import { redirect } from "next/navigation";
import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Heading } from "@astryxdesign/core/Heading";
import { ChevronRight, Plus } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { PageShell } from "@/components/page-shell";
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
    <PageShell width="lg">
      <Heading level={1}>{tr("Your registries", "आपकी रजिस्ट्रियाँ")}</Heading>
      <ul className="mt-6 space-y-3">
        {registries.map((r) => (
          <li key={r.id}>
            <ClickableCard label={`${r.partnerOne} & ${r.partnerTwo}`} href={`/dashboard/${r.slug}`} padding={5}>
              <div className="flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-xl font-semibold text-primary">
                    {r.partnerOne} & {r.partnerTwo}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[15px] text-secondary">
                    {[formatDate(r.weddingDate, lang), r.city].filter(Boolean).join(" · ") || tr("Date not set", "तारीख़ तय नहीं")}
                    {r.role === "family" && <Badge variant="green" label={tr("Family", "परिवार")} />}
                  </div>
                </div>
                <ChevronRight className="size-5 text-secondary" aria-hidden />
              </div>
            </ClickableCard>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <Button width="100%" href="/new" label={tr("Create another registry", "एक और रजिस्ट्री बनाएँ")} icon={<Plus className="size-4" aria-hidden />} />
      </div>
      <form action={logout} className="mt-10 flex flex-col items-center gap-1 text-[15px] text-secondary">
        <span>{prettyPhone(user.phone)}</span>
        <Button type="submit" variant="ghost" label={tr("Sign out", "लॉग आउट")} />
      </form>
    </PageShell>
  );
}
