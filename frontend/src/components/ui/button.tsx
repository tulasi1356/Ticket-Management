import React, { forwardRef } from "react";

import { cn } from "../../lib/utils";

type Size = "xs" | "sm" | "md" | "lg";
type Variant = "primary" | "secondary" | "danger" | "white";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
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
  primary: "bg-blue-500 text-white",
  secondary: "bg-gray-200 text-black",
  danger: "bg-red-500 text-white",
  white: "bg-white text-black border",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      size = "md",
      variant = "primary",
      className,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "rounded-md font-medium",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";