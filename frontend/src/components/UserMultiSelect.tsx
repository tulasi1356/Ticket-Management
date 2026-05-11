import { useEffect, useMemo, useState } from "react"
import { Check, Search, X } from "lucide-react"

import { searchUsers } from "../api/userApi"
import { cn } from "../lib/utils"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"

export type UserMultiSelectUser = { id: number; name: string; email?: string }

type UserMultiSelectProps = {
  value: number[]
  onChange: (next: number[]) => void
  /** Users used to resolve chip labels (project roster, ticket assignees, etc.). */
  resolveUsers?: UserMultiSelectUser[]
  /**
   * When the query is shorter than `minSearchLength`, show up to 10 of these users.
   * Omit for “search-only” mode (ticket filters, etc.).
   */
  browseWhenEmpty?: UserMultiSelectUser[]
  placeholder?: string
  emptySearchHint?: string
  /** Minimum query length before calling `/users/search`. Default 1. */
  minSearchLength?: number
  /** When set, search only returns users assigned to this project (ticket assignees / board filters). */
  projectId?: number | null
}

export function UserMultiSelect({
  value,
  onChange,
  resolveUsers = [],
  browseWhenEmpty,
  placeholder = "Search users...",
  emptySearchHint = "Type to search users",
  minSearchLength = 1,
  projectId,
}: UserMultiSelectProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<UserMultiSelectUser[]>([])
  const [loading, setLoading] = useState(false)
  const [pickedExtras, setPickedExtras] = useState(() => new Map<number, UserMultiSelectUser>())

  const detailsMap = useMemo(() => {
    const m = new Map<number, UserMultiSelectUser>()
    for (const u of resolveUsers) m.set(u.id, u)
    if (browseWhenEmpty?.length) {
      for (const u of browseWhenEmpty) m.set(u.id, u)
    }
    return m
  }, [resolveUsers, browseWhenEmpty])

  useEffect(() => {
    let cancelled = false
    const trimmed = query.trim()

    if (trimmed.length < minSearchLength) {
      if (browseWhenEmpty?.length) {
        setResults(browseWhenEmpty.slice(0, 10))
      } else {
        setResults([])
      }
      return () => {
        cancelled = true
      }
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchUsers(trimmed, { projectId })
        if (!cancelled) setResults(data)
      } catch (e) {
        console.error("User search failed:", e)
        if (!cancelled) setResults([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, browseWhenEmpty, minSearchLength, projectId])

  const selectedUsers = useMemo(() => {
    return value.map((id) => {
      const fromProps = detailsMap.get(id)
      const extra = pickedExtras.get(id)
      return fromProps ?? extra ?? ({ id, name: `User #${id}` } as UserMultiSelectUser)
    })
  }, [value, detailsMap, pickedExtras])

  const toggle = (id: number, row?: UserMultiSelectUser) => {
    if (value.includes(id)) {
      onChange(value.filter((x) => x !== id))
      setPickedExtras((prev) => {
        const next = new Map(prev)
        if (!detailsMap.has(id)) next.delete(id)
        return next
      })
      return
    }

    const resolved = row ?? detailsMap.get(id)
    if (!resolved) return

    onChange([...value, id])
    if (!detailsMap.has(id)) {
      setPickedExtras((prev) => new Map(prev).set(id, resolved))
    }
  }

  const showBrowseOrHint =
    query.trim().length < minSearchLength && !browseWhenEmpty?.length

  return (
    <div className="flex flex-col gap-2">
      {selectedUsers.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((u) => (
            <Badge key={u.id} variant="info" className="gap-1">
              <span className="max-w-[180px] truncate">{u.name}</span>
              <button
                type="button"
                className="ml-1 rounded p-0.5 hover:bg-blue-200"
                onClick={() => toggle(u.id)}
                aria-label={`Remove ${u.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
          aria-label={placeholder}
        />
      </div>

      <div className="max-h-56 overflow-y-auto rounded-md border bg-white">
        {loading ? (
          <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>
        ) : results.length > 0 ? (
          results.map((u) => {
            const checked = value.includes(u.id)
            return (
              <button
                key={u.id}
                type="button"
                aria-label={checked ? `Deselect ${u.name}` : `Select ${u.name}`}
                aria-pressed={checked}
                onClick={() => toggle(u.id, u)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-gray-900">{u.name}</div>
                  {u.email ? (
                    <div className="truncate text-xs text-gray-500">{u.email}</div>
                  ) : null}
                </div>
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                    checked
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 bg-white text-transparent"
                  )}
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
              </button>
            )
          })
        ) : query.trim().length >= minSearchLength ? (
          <div className="px-3 py-2 text-sm text-gray-500">No users found.</div>
        ) : showBrowseOrHint ? (
          <div className="px-3 py-2 text-sm text-gray-500">{emptySearchHint}</div>
        ) : null}
      </div>
    </div>
  )
}
