import { cn } from "../../lib/utils"

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "secondary"

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
  size?: "xs" | "sm" | "md" | "lg"
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-50 text-gray-600",
  secondary: "bg-gray-50 text-gray-600",
  success: "bg-green-50 text-green-600",
  warning: "bg-yellow-50 text-yellow-600",
  danger: "bg-red-50 text-red-600",
  info: "bg-blue-100 text-blue-700",
}

const sizeClasses: Record<"xs" | "sm" | "md" | "lg", string> = {
  xs: "text-xs px-2 py-1",
  sm: "text-sm px-3 py-1.5",
  md: "text-base px-4 py-2",
  lg: "text-lg px-6 py-3",
}

export function Badge({
  children,
  variant = "default",
  size = "md",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        sizeClasses[size],
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}