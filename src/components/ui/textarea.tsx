import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm",
        "placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-600"
      , className)}
      {...props}
    />
  );
});
