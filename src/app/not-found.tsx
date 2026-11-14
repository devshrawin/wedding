import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Mark } from "@/components/brand";
import { PageShell } from "@/components/page-shell";

export default function NotFound() {
  return (
    <PageShell>
      <div className="pt-8">
        <Card padding={6}>
          <EmptyState
            headingLevel={1}
            icon={<Mark className="size-14" />}
            title="Page not found · पेज नहीं मिला"
            description="The link may be mistyped, or the registry was removed. · लिंक गलत हो सकता है, या रजिस्ट्री हटा दी गई है।"
            actions={<Button variant="primary" href="/" label="Go home · होम पर जाएँ" />}
          />
        </Card>
      </div>
    </PageShell>
  );
}
