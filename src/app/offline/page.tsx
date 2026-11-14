import { Mark } from "@/components/brand";

export const metadata = { title: "Offline" };

export default function Offline() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <Mark className="mx-auto size-14" />
        <h1 className="mt-5 font-display text-2xl font-semibold text-primary">You&apos;re offline · आप ऑफ़लाइन हैं</h1>
        <p className="mt-2 text-secondary">Please check your internet and try again.<br />कृपया इंटरनेट जाँचकर दोबारा कोशिश करें।</p>
      </div>
    </main>
  );
}
