"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { createRegistry } from "@/app/actions/registry";
import { EssentialsPicker, FundPicker } from "@/components/catalog-picker";
import { useLang, useTr } from "@/components/lang";
import { RegistryFields, type RegistryDraft } from "@/components/registry-fields";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/bits";
import { CATALOG } from "@/lib/catalog";
import { errorText } from "@/lib/result";

export function CreateWizard() {
  const tr = useTr();
  const lang = useLang();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [draft, setDraft] = useState<RegistryDraft>({ partnerOne: "", partnerTwo: "", weddingDate: "", city: "", note: "", theme: "sindoor", photo: null });
  const [funds, setFunds] = useState<string[]>(["shagun"]);
  const [essentials, setEssentials] = useState<string[]>(CATALOG.filter((c) => c.starter).map((c) => c.id));
  const [pending, start] = useTransition();

  const namesOk = draft.partnerOne.trim() && draft.partnerTwo.trim();
  const picked = funds.length + essentials.length;

  const submit = () =>
    start(async () => {
      const res = await createRegistry({ ...draft, catalogIds: essentials, fundIds: funds, lang });
      if (!res.ok) {
        toast(errorText(res.error, tr), "error");
        return;
      }
      router.push(`/dashboard/${res.slug}?welcome=1`);
    });

  return (
    <div>
      <div className="mb-6 flex items-center gap-2" aria-hidden>
        {[1, 2].map((n) => (
          <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-primary" : "bg-line"}`} />
        ))}
      </div>

      {step === 1 ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (namesOk) {
              setStep(2);
              window.scrollTo({ top: 0 });
            }
          }}
        >
          <p className="eyebrow">{tr("Step 1 of 2", "चरण 1 / 2")}</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{tr("Who's getting married?", "शादी किसकी है?")}</h1>
          <p className="mt-2 text-muted">{tr("Just the basics. You can change everything later.", "बस ज़रूरी जानकारी। बाद में सब बदला जा सकता है।")}</p>
          <div className="card mt-6 p-5 sm:p-6">
            <RegistryFields value={draft} onChange={(p) => setDraft((d) => ({ ...d, ...p }))} showNote={false} />
          </div>
          <StickyBar>
            <Button type="submit" size="lg" block disabled={!namesOk}>
              {tr("Next", "आगे")} <ArrowRight className="size-5" />
            </Button>
          </StickyBar>
        </form>
      ) : (
        <div>
          <p className="eyebrow">{tr("Step 2 of 2", "चरण 2 / 2")}</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{tr("What would you love?", "आपको क्या चाहिए?")}</h1>
          <p className="mt-2 text-muted">
            {tr("We've ticked a few favourites to get you started. Tap to add or remove — or skip and paste product links later.", "शुरुआत के लिए कुछ पसंदीदा चीज़ें चुन दी हैं। टैप करके जोड़ें या हटाएँ — या छोड़ दें और बाद में लिंक डालें।")}
          </p>

          <h2 className="mb-3 mt-8 flex items-center gap-2 text-xl font-semibold">
            <Sparkles className="size-5 text-gold" /> {tr("Shagun & funds", "शगुन और फंड")}
          </h2>
          <FundPicker selected={funds} onChange={setFunds} />

          <h2 className="mb-3 mt-10 text-xl font-semibold">{tr("Wedding essentials", "शादी का ज़रूरी सामान")}</h2>
          <EssentialsPicker selected={essentials} onChange={setEssentials} />

          <StickyBar>
            <Button variant="outline" size="lg" onClick={() => setStep(1)} aria-label={tr("Back", "पीछे")}>
              <ArrowLeft className="size-5" />
            </Button>
            <Button size="lg" block loading={pending} onClick={submit}>
              {picked > 0 ? tr(`Create registry with ${picked} wishes`, `${picked} चीज़ों के साथ रजिस्ट्री बनाएँ`) : tr("Create empty registry", "खाली रजिस्ट्री बनाएँ")}
            </Button>
          </StickyBar>
        </div>
      )}
    </div>
  );
}

function StickyBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-line bg-cream/95 px-5 pt-3 backdrop-blur">
      <div className="mx-auto flex max-w-2xl gap-3">{children}</div>
    </div>
  );
}
