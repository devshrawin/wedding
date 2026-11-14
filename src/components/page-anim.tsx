"use client";

import { usePathname } from "next/navigation";

/** Re-plays the gentle page entrance on every navigation inside a persistent layout. */
export function PageAnim({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="anim-page">
      {children}
    </div>
  );
}
