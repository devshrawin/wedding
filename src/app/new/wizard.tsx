"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Icon } from "@astryxdesign/core/Icon";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Step, Stepper } from "@astryxdesign/core/Stepper";
import { Text } from "@astryxdesign/core/Text";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { createRegistry } from "@/app/actions/registry";
import { EssentialsPicker, FundPicker } from "@/components/catalog-picker";
import { useLang, useTr } from "@/components/lang";
import { RegistryFields, type RegistryDraft } from "@/components/registry-fields";
import { toast } from "@/components/ui/feedback";
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

  const namesOk = Boolean(draft.partnerOne.trim() && draft.partnerTwo.trim());
  const picked = funds.length + essentials.length;

  const submit = () =>
    start(async () => {
      const res = await createRegistry({ ...draft, photo: draft.photo === "keep" ? null : draft.photo, catalogIds: essentials, fundIds: funds, lang });
      if (!res.ok) return toast(errorText(res.error, tr), "error");
      router.push(`/dashboard/${res.slug}?welcome=1`);
    });

  return (
    <div>
      <div className="mb-6">
        <Stepper label={tr("Create registry", "रजिस्ट्री बनाएँ")} activeStep={step - 1} density="compact">
          <Step step={0} label={tr("Your wedding", "आपकी शादी")} />
          <Step step={1} label={tr("Your wishes", "आपकी पसंद")} />
        </Stepper>
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
          <Heading level={1}>{tr("Who's getting married?", "शादी किसकी है?")}</Heading>
          <Text as="p" type="supporting" display="block">
            {tr("Just the basics. You can change everything later.", "बस ज़रूरी जानकारी। बाद में सब बदला जा सकता है।")}
          </Text>
          <div className="mt-6">
            <Card padding={5}>
              <RegistryFields value={draft} onChange={(p) => setDraft((d) => ({ ...d, ...p }))} showNote={false} />
            </Card>
          </div>
          <StickyBar>
            <Button type="submit" variant="primary" size="lg" width="100%" label={tr("Next", "आगे")} endContent={<Icon icon={ArrowRight} />} isDisabled={!namesOk} />
          </StickyBar>
        </form>
      ) : (
        <div>
          <Heading level={1}>{tr("What would you love?", "आपको क्या चाहिए?")}</Heading>
          <Text as="p" type="supporting" display="block">
            {tr("We've ticked a few favourites. Tap to add or remove, or skip and paste product links later.", "कुछ पसंदीदा चीज़ें पहले से चुनी हैं। टैप करके जोड़ें या हटाएँ, या छोड़ दें और बाद में लिंक डालें।")}
          </Text>

          <h2 className="mb-3 mt-8 flex items-center gap-2 font-display text-xl font-semibold text-primary">
            <Sparkles className="size-5 text-gold" aria-hidden /> {tr("Shagun & funds", "शगुन और फंड")}
          </h2>
          <FundPicker selected={funds} onChange={setFunds} />

          <h2 className="mb-3 mt-10 font-display text-xl font-semibold text-primary">{tr("Wedding essentials", "शादी का ज़रूरी सामान")}</h2>
          <EssentialsPicker selected={essentials} onChange={setEssentials} />

          <StickyBar>
            <IconButton size="lg" label={tr("Back", "पीछे")} icon={<Icon icon={ArrowLeft} />} onClick={() => setStep(1)} />
            <Button
              variant="primary"
              size="lg"
              width="100%"
              isLoading={pending}
              onClick={submit}
              label={picked > 0 ? tr(`Create registry with ${picked} wishes`, `${picked} चीज़ों के साथ रजिस्ट्री बनाएँ`) : tr("Create empty registry", "खाली रजिस्ट्री बनाएँ")}
            />
          </StickyBar>
        </div>
      )}
    </div>
  );
}

function StickyBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 px-4 pt-3 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center gap-3">{children}</div>
    </div>
  );
}
