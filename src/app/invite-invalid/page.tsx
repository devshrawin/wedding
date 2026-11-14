import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { LinkIcon } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { getTr } from "@/lib/i18n";

export const metadata = { title: "Invite not valid" };

export default async function InviteInvalid() {
  const { tr } = await getTr();
  return (
    <PageShell>
      <div className="pt-8">
        <Card padding={6}>
          <EmptyState
            headingLevel={1}
            icon={<LinkIcon className="size-10 text-accent" />}
            title={tr("This invite link isn't working", "यह आमंत्रण लिंक काम नहीं कर रहा")}
            description={tr("It may have been removed. Please ask the couple to send you a new link.", "शायद इसे हटा दिया गया है। कृपया जोड़े से नया लिंक माँगें।")}
            actions={<Button href="/" label={tr("Go to Giftr", "Giftr पर जाएँ")} />}
          />
        </Card>
      </div>
    </PageShell>
  );
}
