import { useState } from "react"
import { toast } from "sonner"
import { requestTicketExport } from "../api/ticketApi"

export function useAdminTicketExport() {
  const [busy, setBusy] = useState(false)

  const run = async () => {
    setBusy(true)
    try {
      const res = await requestTicketExport()
      const title = res.message ?? "Export queued."
      const lines = [
        res.jobId ? `Job ID: ${res.jobId} (check Sidekiq / Redis if the email is slow).` : null,
        "The email includes a CSV attachment: projects, sprints, tickets, and statuses.",
        import.meta.env.DEV
          ? "In dev, Rails often saves mail under tmp/mail (unless SMTP env vars are set)."
          : null,
      ].filter(Boolean) as string[]
      toast.success(title, {
        description: lines.join(" "),
        duration: 12_000,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not queue export")
    } finally {
      setBusy(false)
    }
  }

  return { busy, run }
}
