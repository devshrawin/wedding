import { notFound } from "next/navigation";
import { ArrowLeft, FileSpreadsheet } from "lucide-react";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { getManagedRegistry, requireUser } from "@/lib/auth";
import { loadRegistryData } from "@/lib/data";
import { buildEntries, guestLabel, methodLabel } from "@/lib/entries";
import { getTr } from "@/lib/i18n";
import { giftWordFor } from "@/lib/traditions";
import { formatDate, inr } from "@/lib/utils";
import { PrintButton } from "./print-button";

export const metadata = { title: "Gift ledger" };

/**
 * The family vahi (bahi-khata): a print-ready ledger. "Save as PDF" in the
 * print dialog produces the PDF — this keeps Devanagari rendering perfect
 * on every device without shipping a PDF engine.
 */
export default async function LedgerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser(`/dashboard/${slug}/ledger`);
  const managed = await getManagedRegistry(slug, user);
  if (!managed) notFound();
  const { registry } = managed;
  const [{ tr, lang }, data] = await Promise.all([getTr(), loadRegistryData(registry.id)]);
  // Oldest first, like a notebook. Only what was actually received.
  const rows = buildEntries(data.items, data.reservations, data.contributions)
    .filter((e) => e.kind === "reservation" || e.status === "confirmed")
    .reverse();
  const word = giftWordFor(registry, lang);
  const cash = rows.filter((r) => r.kind === "contribution");
  const gifts = rows.filter((r) => r.kind === "reservation");
  const total = cash.reduce((s, r) => s + (r.amount ?? 0), 0);

  return (
    <div className="pb-10">
      <div className="no-print mb-5 flex flex-wrap items-center gap-2.5">
        <Button variant="ghost" size="sm" href={`/dashboard/${slug}/received`} label={tr("Back", "वापस")} icon={<ArrowLeft className="size-4" aria-hidden />} />
        <span className="flex-1" />
        <Button size="sm" href={`/api/ledger/${slug}`} label={tr("Excel (CSV)", "Excel (CSV)")} icon={<FileSpreadsheet className="size-4" aria-hidden />} />
        <PrintButton label={tr("Save as PDF / Print", "PDF सेव करें / छापें")} />
      </div>
      <div className="no-print mb-4">
        <Banner
          status="info"
          collapsible={false}
          title={tr("In the print window, choose “Save as PDF”.", "प्रिंट विंडो में “Save as PDF” चुनें।")}
          description={tr("Switch the language at the top for a Hindi ledger.", "अंग्रेज़ी बही के लिए ऊपर भाषा बदलें।")}
        />
      </div>

      <article className="ledger mx-auto max-w-[210mm] rounded-sm border-[3px] border-double border-[var(--color-accent)] bg-[#fffdf6] p-6 text-[#2a1a16] shadow-md sm:p-10 print:border-[3px] print:shadow-none">
        <header className="border-b-2 border-[var(--color-accent)] pb-5 text-center">
          {/* Only shown when the couple chose a heading (e.g. through a ceremony style). */}
          {registry.ledgerHeading && <p className="mb-2 text-lg font-semibold text-accent">{registry.ledgerHeading}</p>}
          <h1 className="text-3xl font-semibold text-accent sm:text-4xl">{tr("Gift ledger", "उपहार बही")}</h1>
          <p className="mt-2 font-display text-2xl font-semibold">
            {registry.partnerOne} & {registry.partnerTwo}
          </p>
          <p className="text-[15px] text-[#75645c]">{[formatDate(registry.weddingDate, lang), registry.city].filter(Boolean).join(" · ")}</p>
        </header>

        <section className="mt-6">
          <h2 className="text-xl font-semibold text-[var(--color-accent)]">{tr(`${word} received`, `प्राप्त ${word}`)}</h2>
          {cash.length ? (
            <table className="mt-3 w-full border-collapse text-[15px]">
              <thead>
                <tr className="border-y-2 border-[var(--color-accent)] text-left text-[13px] uppercase tracking-wide text-[var(--color-accent)]">
                  <th className="w-10 py-2 pr-2">{tr("No.", "क्र.")}</th>
                  <th className="py-2 pr-2">{tr("Name", "नाम")}</th>
                  <th className="hidden py-2 pr-2 sm:table-cell print:table-cell">{tr("Place", "स्थान")}</th>
                  <th className="hidden py-2 pr-2 sm:table-cell print:table-cell">{tr("Towards", "किसके लिए")}</th>
                  <th className="py-2 pr-2">{tr("Mode", "माध्यम")}</th>
                  <th className="py-2 text-right">{tr("Amount", "राशि")}</th>
                </tr>
              </thead>
              <tbody>
                {cash.map((r, i) => (
                  <tr key={r.id} className="border-b border-dashed border-[#d9c7a8] align-top" style={{ breakInside: "avoid" }}>
                    <td className="py-2 pr-2 text-[#75645c]">{i + 1}</td>
                    <td className="py-2 pr-2 font-semibold">
                      {guestLabel(r, tr)}
                      <span className="block text-xs font-normal text-[#75645c]">{formatDate(r.createdAt, lang)}</span>
                    </td>
                    <td className="hidden py-2 pr-2 sm:table-cell print:table-cell">{r.place ?? "-"}</td>
                    <td className="hidden py-2 pr-2 sm:table-cell print:table-cell">{r.itemTitle ?? "-"}</td>
                    <td className="py-2 pr-2">{methodLabel(r, tr)}</td>
                    <td className="py-2 text-right font-semibold tabular-nums">{inr(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-y-2 border-[var(--color-accent)] text-lg font-bold">
                  <td colSpan={2} className="py-3">
                    {tr("Total", "कुल योग")}
                  </td>
                  <td className="hidden sm:table-cell print:table-cell" colSpan={2} />
                  <td />
                  <td className="py-3 text-right tabular-nums text-[var(--color-accent)]">{inr(total) || "₹0"}</td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <p className="mt-3 text-[#75645c]">{tr("Nothing recorded yet.", "अभी कुछ दर्ज नहीं है।")}</p>
          )}
        </section>

        {gifts.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold text-[var(--color-accent)]">{tr("Gifts", "तोहफ़े")}</h2>
            <table className="mt-3 w-full border-collapse text-[15px]">
              <thead>
                <tr className="border-y-2 border-[var(--color-accent)] text-left text-[13px] uppercase tracking-wide text-[var(--color-accent)]">
                  <th className="w-10 py-2 pr-2">{tr("No.", "क्र.")}</th>
                  <th className="py-2 pr-2">{tr("Name", "नाम")}</th>
                  <th className="py-2 pr-2">{tr("Gift", "तोहफ़ा")}</th>
                  <th className="py-2 text-right">{tr("Approx. value", "अनुमानित मूल्य")}</th>
                </tr>
              </thead>
              <tbody>
                {gifts.map((r, i) => (
                  <tr key={r.id} className="border-b border-dashed border-[#d9c7a8] align-top" style={{ breakInside: "avoid" }}>
                    <td className="py-2 pr-2 text-[#75645c]">{i + 1}</td>
                    <td className="py-2 pr-2 font-semibold">{guestLabel(r, tr)}</td>
                    <td className="py-2 pr-2">{r.itemTitle ?? "-"}</td>
                    <td className="py-2 text-right tabular-nums">{r.value ? inr(r.value) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <footer className="mt-10 flex items-end justify-between text-xs text-[#75645c]">
          <span>
            {tr("Prepared on", "तैयार किया गया:")} {formatDate(new Date().toISOString(), lang)}
          </span>
          <span>Giftr</span>
        </footer>
      </article>
    </div>
  );
}
