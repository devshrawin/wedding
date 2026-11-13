import { Logo } from "@/components/brand";
import { LangToggle } from "@/components/lang";
import { requireUser } from "@/lib/auth";
import { CreateWizard } from "./wizard";

export const metadata = { title: "Create your registry" };

export default async function NewRegistryPage() {
  await requireUser("/new");
  return (
    <div className="bg-festive min-h-dvh">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
        <Logo href="/dashboard" />
        <LangToggle />
      </header>
      <main className="mx-auto max-w-2xl px-5 pb-32">
        <CreateWizard />
      </main>
    </div>
  );
}
