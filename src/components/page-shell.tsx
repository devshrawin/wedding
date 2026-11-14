import { Logo } from "@/components/brand";
import { LangToggle } from "@/components/lang";
import { cn } from "@/lib/utils";

/** Simple top bar + centred column used by login, wizard and status pages. */
export function PageShell({ children, width = "md", logoHref = "/" }: { children: React.ReactNode; width?: "md" | "lg"; logoHref?: string }) {
  return (
    <div className="bg-festive min-h-dvh">
      <header className={cn("mx-auto flex items-center justify-between gap-3 px-4 py-4 sm:px-6", width === "md" ? "max-w-md" : "max-w-2xl")}>
        <Logo href={logoHref} />
        <LangToggle />
      </header>
      <main className={cn("mx-auto px-4 pb-16 sm:px-6", width === "md" ? "max-w-md" : "max-w-2xl")}>{children}</main>
    </div>
  );
}
