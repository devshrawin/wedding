"use client";

import { CountUp } from "@/components/motion";
import { inr } from "@/lib/utils";

/** A rupee figure that counts up once when it first appears. */
export function Rupees({ value }: { value: number }) {
  return <CountUp value={value} format={(n) => inr(n) || "₹0"} />;
}
