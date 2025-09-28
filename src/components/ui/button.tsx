"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "outline";
type Size = "sm" | "md";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: Variant;
  size?: Size;
}

const base =
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors " +
  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-600 focus:ring-offset-neutral-950 " +
  "disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  default: "bg-neutral-800 text-neutral-100 hover:bg-neutral-700",
  outline: "border border-neutral-700 bg-transparent hover:bg-neutral-900 text-neutral-100",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 py-1.5",
  md: "h-10 px-4 py-2",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "default", size = "md", asChild, children, ...props },
  ref
) {
  const classes = cn(base, variants[variant], sizes[size], className);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as any, {
      className: cn((children as any).props?.className, classes),
      ref,
      ...props,
    });
  }
  return (
    <button ref={ref} className={classes} {...props}>
      {children}
    </button>
  );
});
