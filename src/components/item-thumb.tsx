"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/** Product image with a friendly emoji tile behind it (shown while loading, or if the store's image fails). */
export function ItemThumb({ imageUrl, emoji, className }: { imageUrl?: string | null; emoji?: string | null; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn("relative grid place-items-center overflow-hidden rounded-2xl bg-primary-soft", className)}>
      <span className="text-[2.2em] leading-none" aria-hidden>
        {emoji || "🎁"}
      </span>
      {imageUrl && !failed && (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full bg-white object-contain p-1.5"
        />
      )}
    </div>
  );
}
