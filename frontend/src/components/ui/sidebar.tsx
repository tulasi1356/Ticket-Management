import * as React from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"

type DrawerProps = {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  /** Short label for assistive tech (e.g. "Create ticket"). */
  ariaLabel?: string
}

export function Drawer({ open, onClose, children, ariaLabel = "Panel" }: DrawerProps) {
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
  }, [open])

  React.useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onEsc)
    return () => window.removeEventListener("keydown", onEsc)
  }, [onClose, open])

  return (
    <>
      {/* Overlay */}
      <div
        role="presentation"
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity motion-reduce:transition-none",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-hidden={open ? undefined : true}
        inert={!open}
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-[420px] bg-white shadow-xl transition-transform duration-300 motion-reduce:transition-none",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Close button */}
        <button
          id = "close-sidebar-button"
          type="button"
          aria-label="Close panel"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-2 text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--app-focus-ring-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <X className="size-4" />
        </button>

        {children}
      </div>
    </>
  )
}