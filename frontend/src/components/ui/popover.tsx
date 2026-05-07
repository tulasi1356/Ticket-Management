import * as React from "react"
import * as RadixPopover from "@radix-ui/react-popover"
import { cn } from "../../lib/utils"

type PopoverSize = "sm" | "md" | "lg"

const sizeClasses: Record<PopoverSize, string> = {
  sm: "w-48",
  md: "w-64",
  lg: "w-80",
}

/* ================= ROOT ================= */

export const Popover = RadixPopover.Root

/* ================= TRIGGER ================= */

export const PopoverTrigger = RadixPopover.Trigger

/* ================= CONTENT ================= */

interface PopoverContentProps
  extends React.ComponentPropsWithoutRef<typeof RadixPopover.Content> {
  size?: PopoverSize
}

export const PopoverContent = React.forwardRef<
  React.ElementRef<typeof RadixPopover.Content>,
  PopoverContentProps
>(({ size = "md", ...props }, ref) => (
  <RadixPopover.Portal>
    <RadixPopover.Content
      ref={ref}
      sideOffset={8}
      className={cn(
        "rounded-md border bg-white p-4 shadow-md",
        sizeClasses[size],
      )}
      {...props}
    />
  </RadixPopover.Portal>
))

PopoverContent.displayName = "PopoverContent"