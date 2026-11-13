import Link from "next/link";
import { Mark } from "@/components/brand";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="bg-festive grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <Mark className="mx-auto size-14" />
        <h1 className="mt-5 text-3xl font-semibold">Page not found · पेज नहीं मिला</h1>
        <p className="mt-2 text-muted">The link may be mistyped, or the registry was removed.<br />लिंक गलत हो सकता है, या रजिस्ट्री हटा दी गई है।</p>
        <Link href="/" className={buttonClass({ className: "mt-6" })}>Go home · होम पर जाएँ</Link>
      </div>
    </main>
  );
}
