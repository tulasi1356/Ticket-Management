import type { Ticket } from "./types"

/** Short prefix for ticket keys, e.g. "Core and Planning" → "CP". */
export function projectKey(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0)
  if (words.length === 0) return "TK"
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

export function formatTicketKey(projectName: string, ticketId: number): string {
  return `${projectKey(projectName)}-${ticketId}`
}

export function sprintStatusUi(status?: string): { label: string; dotClass: string } {
  switch (status) {
    case "active":
      return { label: "Active", dotClass: "bg-emerald-500" }
    case "planned":
      return { label: "Planned", dotClass: "bg-amber-500" }
    case "completed":
      return { label: "Closed", dotClass: "bg-gray-400" }
    default:
      return { label: "—", dotClass: "bg-gray-300" }
  }
}

export function computeTicketStats(tickets: Ticket[]) {
  const total = tickets.length
  const todo = tickets.filter((t) => t.status === "todo").length
  const done = tickets.filter((t) => t.status === "done").length
  const highPriority = tickets.filter((t) => t.priority === "high").length
  return { total, todo, done, highPriority }
}
