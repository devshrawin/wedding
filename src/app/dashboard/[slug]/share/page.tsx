import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getManagedRegistry, requireUser } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { getLang } from "@/lib/i18n";
import { greetingFor } from "@/lib/traditions";
import { appUrl, formatDate, themeOf } from "@/lib/utils";
import { SharePanel } from "./share-panel";

export default async function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser(`/dashboard/${slug}/share`);
  const managed = await getManagedRegistry(slug, user);
  if (!managed) notFound();
  const { registry } = managed;
  const db = await getDb();
  const invites = await db.select().from(schema.invites).where(eq(schema.invites.registryId, registry.id)).orderBy(desc(schema.invites.createdAt));
  const lang = await getLang();
  const theme = themeOf(registry.theme);

  return (
    <SharePanel
      slug={slug}
      origin={appUrl()}
      registry={{
        partnerOne: registry.partnerOne,
        partnerTwo: registry.partnerTwo,
        dateText: formatDate(registry.weddingDate, lang),
        greeting: greetingFor(registry, lang),
        city: registry.city,
        visibility: registry.visibility as "link" | "password" | "invite",
        theme: { primary: theme.primary, deep: theme.deep, soft: theme.soft },
      }}
      invites={invites.map((i) => ({ id: i.id, token: i.token, guestName: i.guestName, opens: i.opens }))}
    />
  );
}
