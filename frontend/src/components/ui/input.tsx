import * as React from "react";
import { cn } from "../../lib/utils";


type Size = "xs" | "sm" | "md" | "lg";
type Variant = "default" | "error";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: Size;
  variant?: Variant;
}

const sizeClasses: Record<Size, string> = {
  xs: "text-xs px-2 py-1",
  sm: "text-sm px-3 py-1.5",
  md: "text-base px-4 py-2",
  lg: "text-lg px-6 py-3",
};

const variantClasses: Record<Variant, string> = {
  default:
    "border border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--app-focus-ring-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-white",
  error:
    "border border-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      size = "md",
      variant = "default",
      type = "text",
      ...props
    },
    ref
  ) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "w-full rounded-md outline-none transition",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";