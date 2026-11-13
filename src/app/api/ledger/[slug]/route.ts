import { getManagedRegistry, getUser } from "@/lib/auth";
import { loadRegistryData } from "@/lib/data";
import { buildEntries } from "@/lib/entries";

/** Escape for CSV and neutralise spreadsheet formulas (=, +, -, @) in guest-supplied text. */
function cell(v: string | number | null | undefined): string {
  let s = v == null ? "" : String(v);
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getUser();
  const managed = user ? await getManagedRegistry(slug, user) : null;
  if (!managed) return new Response("Not found", { status: 404 });
  const data = await loadRegistryData(managed.registry.id);
  const rows = buildEntries(data.items, data.reservations, data.contributions)
    .filter((e) => e.kind === "reservation" || e.status === "confirmed")
    .reverse();
  const lines = [
    ["No", "Date", "Name", "Phone", "Place", "Type", "Towards / Gift", "Mode", "Amount (INR)", "Message", "Thanked"].join(","),
    ...rows.map((r, i) =>
      [
        i + 1,
        r.createdAt.slice(0, 10),
        cell(r.name ?? (r.anonymous ? "Anonymous" : "Guest")),
        cell(r.phone),
        cell(r.place),
        r.kind === "reservation" ? "Gift" : "Shagun",
        cell(r.itemTitle),
        r.method,
        r.amount ?? "",
        cell(r.message),
        r.thanked ? "Yes" : "No",
      ].join(","),
    ),
  ];
  // BOM so Excel opens Hindi names correctly.
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="shagun-ledger-${slug}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
