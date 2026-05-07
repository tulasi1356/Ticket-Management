import * as React from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"

type DrawerProps = {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export function Drawer({ open, onClose, children }: DrawerProps) {
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
  }, [open])

  React.useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onEsc)
    return () => window.removeEventListener("keydown", onEsc)
  }, [onClose])

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-[420px] bg-white shadow-xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Close button */}
        <button
          id = "close-sidebar-button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-2 hover:bg-gray-100"
        >
          <X className="size-4" />
        </button>

        {children}
      </div>
    </>
  )
}