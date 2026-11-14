import { PageShell } from "@/components/page-shell";
import { requireUser } from "@/lib/auth";
import { CreateWizard } from "./wizard";

export const metadata = { title: "Create your registry" };

export default async function NewRegistryPage() {
  await requireUser("/new");
  return (
    <PageShell width="lg" logoHref="/dashboard">
      <div className="pb-24">
        <CreateWizard />
      </div>
    </PageShell>
  );
}
