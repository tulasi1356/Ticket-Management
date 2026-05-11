import React, { forwardRef, type ReactNode } from "react"

import { cn } from "../../lib/utils"

type Size = "xs" | "sm" | "md" | "lg"
type Variant = "primary" | "secondary" | "danger" | "white"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: Size
  variant?: Variant
}

const sizeClasses: Record<Size, string> = {
  xs: "text-xs px-2 py-1",
  sm: "text-sm px-3 py-1.5",
  md: "text-base px-4 py-2",
  lg: "text-lg px-6 py-3",
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

const variantClasses: Record<Variant, string> = {
  primary: `${focusRing} bg-blue-500 text-white hover:bg-blue-600 focus-visible:ring-white focus-visible:ring-offset-blue-600`,
  secondary: `${focusRing} border border-gray-300 bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-blue-600 focus-visible:ring-offset-white`,
  danger: `${focusRing} bg-red-600 text-white hover:bg-red-700 focus-visible:ring-white focus-visible:ring-offset-red-700`,
  white: `${focusRing} border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 focus-visible:ring-blue-600 focus-visible:ring-offset-white`,
}

export type FilePickButtonProps = {
  children: ReactNode
  variant?: Variant
  size?: Size
  className?: string
  disabled?: boolean
  busy?: boolean
  multiple?: boolean
  /** e.g. `"image/*"` — omit to allow any file type */
  accept?: string
  "aria-label": string
  onFilesSelected: (files: FileList | null) => void
}

/**
 * File input styled as a button. Transparent input covers the label so the OS
 * file picker opens reliably (avoids clipped/hidden inputs + programmatic .click()).
 */
export function FilePickButton({
  children,
  variant = "white",
  size = "sm",
  className,
  disabled,
  busy,
  multiple = true,
  accept,
  "aria-label": ariaLabel,
  onFilesSelected,
}: FilePickButtonProps) {
  const blocked = !!(disabled || busy)
  return (
    <span
      className={cn(
        "relative isolate inline-flex max-w-max items-stretch",
        blocked && "pointer-events-none cursor-not-allowed opacity-60"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none z-0 inline-flex select-none items-center gap-1 rounded-md font-medium",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
      >
        {children}
      </span>
      <input
        aria-label={ariaLabel}
        type="file"
        disabled={blocked}
        multiple={multiple}
        {...(accept ? { accept } : {})}
        className="absolute inset-0 z-[1] m-0 h-full min-h-[2.125rem] w-full cursor-pointer border-0 bg-transparent p-0 opacity-0"
        onChange={(e) => {
          onFilesSelected(e.target.files)
          e.target.value = ""
        }}
      />
    </span>
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      size = "md",
      variant = "primary",
      type = "button",
      className,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
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
    )
  }
)

Button.displayName = "Button"
