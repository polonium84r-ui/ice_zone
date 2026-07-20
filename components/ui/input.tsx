import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * shadcn/ui Input — themed with the Thirst. design system (.form-control).
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <input className={cn("form-control", className)} ref={ref} {...props} />
  )
);
Input.displayName = "Input";

export { Input };
