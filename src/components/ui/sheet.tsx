"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Bottom sheet on phones, centred dialog on larger screens. */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 animate-fade bg-ink/50" />
        <Dialog.Content
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] animate-rise flex-col rounded-t-[28px] bg-cream shadow-2xl outline-none",
            "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[88dvh] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:animate-fade sm:rounded-[28px]",
            className,
          )}
        >
          <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-5">
            <div className="min-w-0">
              <Dialog.Title className="font-display text-[22px] font-semibold leading-tight text-ink">{title}</Dialog.Title>
              {description && <Dialog.Description className="mt-1 text-[15px] text-muted">{description}</Dialog.Description>}
            </div>
            <Dialog.Close className="-mr-1 grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-sand" aria-label="Close">
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <div className="safe-bottom overflow-y-auto overscroll-contain px-5 pt-2">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
