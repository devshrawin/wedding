import { notFound } from "next/navigation";
import { Button } from "@astryxdesign/core/Button";
import { Heading } from "@astryxdesign/core/Heading";
import { eq } from "drizzle-orm";
import { logout } from "@/app/actions/auth";
import { getManagedRegistry, requireUser } from "@/lib/auth";
import { razorpayEnabled } from "@/lib/data";
import { getDb, schema } from "@/lib/db";
import { getTr } from "@/lib/i18n";
import { prettyPhone } from "@/lib/utils";
import type { Tradition } from "@/lib/traditions";
import { SettingsForms } from "./settings-forms";

export default async function SettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser(`/dashboard/${slug}/settings`);
  const managed = await getManagedRegistry(slug, user);
  if (!managed) notFound();
  const { registry, role } = managed;
  const db = await getDb();
  const members = await db.select().from(schema.registryMembers).where(eq(schema.registryMembers.registryId, registry.id));
  const { tr } = await getTr();

  return (
    <div className="space-y-6">
      <Heading level={1}>{tr("Settings", "सेटिंग")}</Heading>
      <SettingsForms
        slug={slug}
        role={role}
        razorpay={razorpayEnabled()}
        registry={{
          partnerOne: registry.partnerOne,
          partnerTwo: registry.partnerTwo,
          weddingDate: registry.weddingDate ?? "",
          city: registry.city ?? "",
          note: registry.note ?? "",
          theme: registry.theme,
          photo: registry.photo,
          visibility: registry.visibility as "link" | "password" | "invite",
          hasPassword: !!registry.passwordHash,
          hideReserved: registry.hideReserved,
          showAmounts: registry.showAmounts,
          upiId: registry.upiId ?? "",
          upiName: registry.upiName ?? "",
          ceremony: {
            tradition: registry.tradition as Tradition,
            greeting: registry.greeting ?? "",
            ledgerHeading: registry.ledgerHeading ?? "",
            giftWord: registry.giftWord ?? "",
          },
        }}
        members={members.map((m) => ({ id: m.id, name: m.name, phone: prettyPhone(m.phone), relation: m.relation }))}
      />
      <form action={logout} className="flex flex-col items-center gap-1 pb-4 text-[15px] text-secondary">
        <span>
          {tr("Signed in as", "लॉग इन:")} {prettyPhone(user.phone)}
        </span>
        <Button type="submit" variant="ghost" label={tr("Sign out", "लॉग आउट")} />
      </form>
    </div>
  );
}
