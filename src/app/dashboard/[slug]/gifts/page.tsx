import { notFound } from "next/navigation";
import { getManagedRegistry, requireUser } from "@/lib/auth";
import { loadRegistryData } from "@/lib/data";
import { GiftsManager, type ManagedItem } from "./gifts-manager";

export default async function GiftsPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ add?: string }> }) {
  const { slug } = await params;
  const user = await requireUser(`/dashboard/${slug}/gifts`);
  const managed = await getManagedRegistry(slug, user);
  if (!managed) notFound();
  const { items } = await loadRegistryData(managed.registry.id);
  const list: ManagedItem[] = items.map((i) => ({
    id: i.id,
    kind: i.kind as "product" | "fund",
    title: i.title,
    description: i.description,
    imageUrl: i.imageUrl,
    icon: i.icon,
    url: i.url,
    store: i.store,
    category: i.category,
    price: i.price,
    quantity: i.quantity,
    allowChipIn: i.allowChipIn,
    hidden: i.hidden,
    reservedQty: i.reservedQty,
    raised: i.raised,
    target: i.target,
    progress: i.progress,
    fulfilled: i.fulfilled,
    givers: i.givers,
    chipInLeft: i.chipInLeft,
  }));
  return <GiftsManager slug={slug} items={list} openAdd={(await searchParams).add === "1"} tradition={managed.registry.tradition} giftWord={managed.registry.giftWord} />;
}
