"use client";

import { usePathname, useRouter } from "next/navigation";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { useTr } from "@/components/lang";

export function FilterTabs({ value, counts }: { value: string; counts: { all: number; confirm: number; thank: number } }) {
  const tr = useTr();
  const router = useRouter();
  const pathname = usePathname();
  return (
    <SegmentedControl
      label={tr("Show", "दिखाएँ")}
      layout="fill"
      value={value}
      onChange={(v) => router.replace(v === "all" ? pathname : `${pathname}?filter=${v}`, { scroll: false })}
    >
      <SegmentedControlItem value="all" label={`${tr("All", "सभी")} · ${counts.all}`} />
      <SegmentedControlItem value="confirm" label={`${tr("To confirm", "पुष्टि बाकी")} · ${counts.confirm}`} />
      <SegmentedControlItem value="thank" label={`${tr("To thank", "धन्यवाद बाकी")} · ${counts.thank}`} />
    </SegmentedControl>
  );
}
