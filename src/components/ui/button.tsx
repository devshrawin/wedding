import * as React from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-primary text-white hover:bg-primary-deep active:bg-primary-deep shadow-sm",
  soft: "bg-primary-soft text-primary-deep hover:brightness-95",
  outline: "border border-line bg-white text-ink hover:bg-sand",
  ghost: "text-ink hover:bg-sand",
  whatsapp: "bg-whatsapp text-white hover:brightness-95 shadow-sm",
  danger: "bg-red-50 text-red-700 hover:bg-red-100",
} as const;

const sizes = {
  sm: "h-10 px-4 text-[15px] rounded-xl",
  md: "h-12 px-5 text-base rounded-2xl",
  lg: "h-14 px-6 text-lg rounded-2xl",
} as const;

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  block?: boolean;
};

export function buttonClass(opts: { variant?: keyof typeof variants; size?: keyof typeof sizes; block?: boolean; className?: string } = {}) {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 font-semibold transition-[background,filter,transform] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    variants[opts.variant ?? "primary"],
    sizes[opts.size ?? "md"],
    opts.block && "w-full",
    opts.className,
  );
}

export function Button({ variant, size, loading, block, className, children, disabled, type, ...props }: ButtonProps) {
  return (
    <button type={type ?? "button"} className={buttonClass({ variant, size, block, className })} disabled={disabled || loading} aria-busy={loading} {...props}>
      {loading && <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />}
      {children}
    </button>
  );
}
