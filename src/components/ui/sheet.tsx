"use client";

import { BottomSheet } from "@astryxdesign/core/BottomSheet";
import { Heading } from "@astryxdesign/core/Heading";
import { Icon } from "@astryxdesign/core/Icon";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Text } from "@astryxdesign/core/Text";
import { X } from "lucide-react";
import { useTr } from "@/components/lang";

/** Astryx BottomSheet with a visible title row. Phones get a native-feeling sheet; nothing to install. */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  purpose = "info",
  height = "hug",
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  purpose?: "info" | "form";
  height?: "hug" | "capped" | "tall";
  children: React.ReactNode;
}) {
  const tr = useTr();
  return (
    <BottomSheet isOpen={open} onOpenChange={onOpenChange} label={title} purpose={purpose} height={height} padding={0}>
      <div className="mx-auto w-full max-w-xl">
        <div className="flex items-start gap-3 px-5 pb-1 pt-2">
          <div className="min-w-0 flex-1">
            <Heading level={2}>{title}</Heading>
            {description && (
              <Text as="p" type="supporting" display="block">
                {description}
              </Text>
            )}
          </div>
          <IconButton label={tr("Close", "बंद करें")} variant="ghost" icon={<Icon icon={X} />} onClick={() => onOpenChange(false)} />
        </div>
        <div className="safe-bottom px-5 pt-3">{children}</div>
      </div>
    </BottomSheet>
  );
}
