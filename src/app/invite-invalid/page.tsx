import Link from "next/link";
import { Mark } from "@/components/brand";
import { buttonClass } from "@/components/ui/button";
import { getTr } from "@/lib/i18n";

export const metadata = { title: "Invite not valid" };

export default async function InviteInvalid() {
  const { tr } = await getTr();
  return (
    <main className="bg-festive grid min-h-dvh place-items-center px-6 text-center">
      <div className="max-w-sm">
        <Mark className="mx-auto size-14" />
        <h1 className="mt-5 text-3xl font-semibold">{tr("This invite link isn't working", "यह आमंत्रण लिंक काम नहीं कर रहा")}</h1>
        <p className="mt-2 text-muted">{tr("It may have been removed. Please ask the couple to send you a new link.", "शायद इसे हटा दिया गया है। कृपया जोड़े से नया लिंक माँगें।")}</p>
        <Link href="/" className={buttonClass({ variant: "outline", className: "mt-6" })}>{tr("Go to Giftr", "Giftr पर जाएँ")}</Link>
      </div>
    </main>
  );
}
