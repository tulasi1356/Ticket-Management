import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import {
  ChevronLeft,
  Download,
  Link2,
  Loader2,
  Paperclip,
  Pencil,
  SendHorizontal,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { uploadAttachmentBlob } from "../../api/attachmentsApi"
import { AssigneeAvatar } from "../../components/ui/avatar"
import { Badge } from "../../components/ui/badge"
import { Button, FilePickButton } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Select, type SelectOption } from "../../components/ui/select"
import { useCreateComment } from "../../hooks/comments/useCreateComment"
import { useGetComments } from "../../hooks/comments/useGetComments"
import { useAdminTicketExport } from "../../hooks/useAdminTicketExport"
import { useUpdateTicket } from "../../hooks/tickets/useUpdateTicket"
import { cn } from "../../lib/utils"
import type { ProjectUser, Ticket } from "./types"

const MAX_UPLOAD_HINT = "15 MB"

const STATUSES: SelectOption[] = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In progress" },
  { value: "test", label: "Test" },
  { value: "done", label: "Done" },
]

const PRIORITIES: SelectOption[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
]

const ISSUE_TYPES: SelectOption[] = [
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature" },
  { value: "task", label: "Task" },
]

function normalizeAttachmentUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((u): u is string => typeof u === "string")
    .map((u) => u.trim())
    .filter(Boolean)
}

function toInputDate(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function shortLinkLabel(url: string): string {
  try {
    if (url.startsWith("data:")) return "Embedded file"
    const u = new URL(url)
    return `${u.hostname}${u.pathname === "/" ? "" : u.pathname}`.slice(0, 72)
  } catch {
    return url.slice(0, 48)
  }
}

function looksLikeImageAttachment(url: string): boolean {
  if (url.startsWith("data:image")) return true
  const rx = /\.(png|gif|webp|bmp|svg|avif|jpe?g|heic|heif)(\?|$)/i
  try {
    const { pathname } = new URL(url)
    return rx.test(pathname)
  } catch {
    return rx.test(url.split("?")[0] ?? "")
  }
}

function AttachmentUrlList({
  urls,
  readOnly,
  onRemoveUrl,
}: {
  urls: string[]
  readOnly?: boolean
  onRemoveUrl?: (index: number) => void
}) {
  if (urls.length === 0) return null
  return (
    <ul className="space-y-3">
      {urls.map((url, index) => (
        <li
          key={`${url.slice(0, 48)}-${index}`}
          className="flex flex-wrap items-start gap-2 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2"
        >
          {looksLikeImageAttachment(url) ? (
            <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
              <img
                src={url}
                alt=""
                className="max-h-20 max-w-[200px] rounded border border-gray-200 object-contain"
                onError={(ev) => {
                  ;(ev.currentTarget as HTMLImageElement).style.display = "none"
                }}
              />
            </a>
          ) : null}
          <div className="min-w-0 flex-1">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              {shortLinkLabel(url)}
            </a>
          </div>
          {!readOnly && onRemoveUrl ? (
            <button
              type="button"
              className="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-800"
              aria-label={`Remove attachment ${index + 1}`}
              onClick={() => onRemoveUrl(index)}
            >
              <Trash2 className="size-4" />
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

function priorityBadge(priority: string) {
  if (priority === "low") return <Badge size="sm" variant="default">Low</Badge>
  if (priority === "medium") return <Badge size="sm" variant="warning">Medium</Badge>
  return <Badge size="sm" variant="danger">High</Badge>
}

function statusBadge(status: string) {
  if (status === "todo") return <Badge size="sm" variant="default">Todo</Badge>
  if (status === "in_progress") return <Badge size="sm" variant="warning">In Progress</Badge>
  if (status === "test") return <Badge size="sm" variant="info">Test</Badge>
  if (status === "done") return <Badge size="sm" variant="success">Done</Badge>
  return null
}

function issueTypeLabel(issueType: string) {
  if (issueType === "bug") return "Bug"
  if (issueType === "feature") return "Feature"
  if (issueType === "task") return "Task"
  return issueType
}

function SidebarRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="border-b border-gray-100 py-3 last:border-b-0">
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <div className="text-sm text-gray-900">{children}</div>
    </div>
  )
}

type TicketDetailPanelProps = {
  ticket: Ticket
  ticketKey: string
  projectName?: string
  sprintName?: string
  projectUsers?: ProjectUser[]
  onBack: () => void
  isAdmin?: boolean
}

export function TicketDetailPanel({
  ticket,
  ticketKey,
  projectName,
  sprintName,
  projectUsers,
  onBack,
  isAdmin = false,
}: TicketDetailPanelProps) {
  const { mutateAsync: saveTicket, isPending: saving } = useUpdateTicket()
  const { mutateAsync: postComment, isPending: postingComment } = useCreateComment()
  const { data: comments, isLoading: loadingComments, isError: commentsError } = useGetComments(
    ticket.id
  )

  const [editing, setEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(ticket.title)
  const [draftDescription, setDraftDescription] = useState(ticket.description ?? "")
  const [draftStatus, setDraftStatus] = useState(ticket.status)
  const [draftPriority, setDraftPriority] = useState(ticket.priority)
  const [draftIssueType, setDraftIssueType] = useState(ticket.issue_type)
  const [draftAssigneeId, setDraftAssigneeId] = useState<number | null>(
    ticket.assignee?.id ?? null
  )
  const [draftStartDate, setDraftStartDate] = useState(() => toInputDate(ticket.start_date))
  const [draftEndDate, setDraftEndDate] = useState(() => toInputDate(ticket.end_date))
  const [draftAttachments, setDraftAttachments] = useState<string[]>(() =>
    normalizeAttachmentUrls(ticket.attachment_urls)
  )
  const [newAttachmentUrl, setNewAttachmentUrl] = useState("")
  const [ticketUploadBusy, setTicketUploadBusy] = useState(false)

  const [commentBody, setCommentBody] = useState("")
  const [commentAttachments, setCommentAttachments] = useState<string[]>([])
  const [commentNewUrl, setCommentNewUrl] = useState("")
  const [commentUploadBusy, setCommentUploadBusy] = useState(false)
  const { busy: exportBusy, run: runAdminExport } = useAdminTicketExport()

  useEffect(() => {
    if (editing) return
    setDraftTitle(ticket.title)
    setDraftDescription(ticket.description ?? "")
    setDraftStatus(ticket.status)
    setDraftPriority(ticket.priority)
    setDraftIssueType(ticket.issue_type)
    setDraftAssigneeId(ticket.assignee?.id ?? null)
    setDraftStartDate(toInputDate(ticket.start_date))
    setDraftEndDate(toInputDate(ticket.end_date))
    setDraftAttachments(normalizeAttachmentUrls(ticket.attachment_urls))
    setNewAttachmentUrl("")
  }, [ticket, editing])

  const assigneeOptions = useMemo(() => {
    const opts: SelectOption[] = []
    const seen = new Set<number>()
    for (const u of projectUsers ?? []) {
      seen.add(u.id)
      opts.push({ label: u.name, value: u.id })
    }
    const aid = ticket.assignee?.id
    const aname = ticket.assignee?.name
    if (aid != null && !seen.has(aid)) {
      opts.unshift({ label: aname ?? `User ${aid}`, value: aid })
    }
    return opts
  }, [projectUsers, ticket.assignee])

  const breadcrumb = [projectName, sprintName].filter(Boolean).join(" › ")
  const displayDescription =
    ticket.description?.trim() || "No description provided."
  const viewAttachments = normalizeAttachmentUrls(ticket.attachment_urls)

  const beginEdit = () => {
    setDraftTitle(ticket.title)
    setDraftDescription(ticket.description ?? "")
    setDraftStatus(ticket.status)
    setDraftPriority(ticket.priority)
    setDraftIssueType(ticket.issue_type)
    setDraftAssigneeId(ticket.assignee?.id ?? null)
    setDraftStartDate(toInputDate(ticket.start_date))
    setDraftEndDate(toInputDate(ticket.end_date))
    setDraftAttachments(normalizeAttachmentUrls(ticket.attachment_urls))
    setNewAttachmentUrl("")
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
  }

  const addUrlAttachment = () => {
    const raw = newAttachmentUrl.trim()
    if (!raw) return
    let parsed: URL | null = null
    try {
      parsed = new URL(raw)
    } catch {
      parsed = null
    }
    if (!parsed || (parsed.protocol !== "http:" && parsed.protocol !== "https:")) {
      toast.error("Enter a valid http(s) URL")
      return
    }
    if (draftAttachments.includes(raw)) {
      toast.message("That link is already added")
      return
    }
    setDraftAttachments((prev) => [...prev, raw])
    setNewAttachmentUrl("")
  }

  const onPickTicketFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setTicketUploadBusy(true)
    try {
      for (const file of Array.from(files)) {
        try {
          const url = await uploadAttachmentBlob(file)
          setDraftAttachments((prev) => [...prev, url])
        } catch (err) {
          toast.error(err instanceof Error ? err.message : `Upload failed for ${file.name}`)
        }
      }
    } finally {
      setTicketUploadBusy(false)
    }
  }

  const handleSave = async () => {
    const title = draftTitle.trim()
    if (!title) {
      toast.error("Title is required")
      return
    }
    if (draftAssigneeId == null) {
      toast.error("Choose an assignee")
      return
    }
    if (!draftStartDate || !draftEndDate) {
      toast.error("Start and end dates are required")
      return
    }
    if (draftStartDate > draftEndDate) {
      toast.error("Start date cannot be after end date")
      return
    }

    try {
      await saveTicket({
        id: ticket.id,
        payload: {
          title,
          description: draftDescription.trim() || null,
          status: draftStatus,
          priority: draftPriority,
          issue_type: draftIssueType,
          assignee_id: draftAssigneeId,
          start_date: draftStartDate,
          end_date: draftEndDate,
          attachment_urls: draftAttachments,
        },
      })
      toast.success("Ticket saved")
      setEditing(false)
    } catch {
      toast.error("Could not save ticket")
    }
  }

  const addCommentUrl = () => {
    const raw = commentNewUrl.trim()
    if (!raw) return
    let parsed: URL | null = null
    try {
      parsed = new URL(raw)
    } catch {
      parsed = null
    }
    if (!parsed || (parsed.protocol !== "http:" && parsed.protocol !== "https:")) {
      toast.error("Enter a valid http(s) URL")
      return
    }
    if (commentAttachments.includes(raw)) {
      toast.message("That link is already added")
      return
    }
    setCommentAttachments((prev) => [...prev, raw])
    setCommentNewUrl("")
  }

  const onPickCommentFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setCommentUploadBusy(true)
    try {
      for (const file of Array.from(files)) {
        try {
          const url = await uploadAttachmentBlob(file)
          setCommentAttachments((prev) => [...prev, url])
        } catch (err) {
          toast.error(err instanceof Error ? err.message : `Upload failed for ${file.name}`)
        }
      }
    } finally {
      setCommentUploadBusy(false)
    }
  }

  const submitComment = async () => {
    const msg = commentBody.trim()
    const urls = commentAttachments
    if (!msg && urls.length === 0) {
      toast.error("Add a message or an attachment")
      return
    }
    try {
      await postComment({
        ticket_id: ticket.id,
        message: msg,
        attachment_urls: urls,
      })
      setCommentBody("")
      setCommentAttachments([])
      setCommentNewUrl("")
      toast.success("Comment added")
    } catch {
      toast.error("Could not post comment")
    }
  }

  const attachmentList = editing ? draftAttachments : viewAttachments

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-6">
      <div className="min-h-0 flex min-w-0 flex-1 flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              <ChevronLeft className="size-4" aria-hidden />
              Back to board
            </button>
            <div className="flex flex-wrap items-center gap-2">
              {editing ? (
                <>
                  <Button type="button" variant="secondary" size="sm" onClick={cancelEdit} disabled={saving}>
                    Cancel
                  </Button>
                  <Button type="button" variant="primary" size="sm" onClick={() => void handleSave()} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-1 size-4 animate-spin" aria-hidden />
                        Saving…
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </>
              ) : (
                <>
                  {isAdmin ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={exportBusy}
                      onClick={() => void runAdminExport()}
                    >
                      {exportBusy ? (
                        <>
                          <Loader2 className="mr-1 size-4 animate-spin" aria-hidden />
                          Export…
                        </>
                      ) : (
                        <>
                          <Download className="mr-1 size-4" aria-hidden />
                          Export
                        </>
                      )}
                    </Button>
                  ) : null}
                  <Button type="button" variant="white" size="sm" onClick={beginEdit}>
                    <Pencil className="mr-1 size-4" aria-hidden />
                    Edit
                  </Button>
                </>
              )}
            </div>
          </div>
          {breadcrumb ? (
            <p className="mb-1 text-xs text-gray-500">{breadcrumb}</p>
          ) : null}
          <p className="font-mono text-xs font-semibold text-gray-500">{ticketKey}</p>
          {editing ? (
            <label className="mt-2 block">
              <span className="sr-only">Title</span>
              <Input
                size="sm"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                className="mt-2 font-semibold text-gray-900"
                aria-label="Ticket title"
              />
            </label>
          ) : (
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-gray-900">{ticket.title}</h2>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <section className="mb-8">
            <h3 className="mb-2 text-sm font-semibold text-gray-800">Description</h3>
            {editing ? (
              <textarea
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                rows={5}
                className={cn(
                  "w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm leading-relaxed text-gray-900 outline-none transition",
                  "focus-visible:ring-2 focus-visible:ring-[color:var(--app-focus-ring-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                )}
                aria-label="Description"
              />
            ) : (
              <div
                className={cn(
                  "rounded-lg border border-gray-100 bg-gray-50/80 px-4 py-3 text-sm leading-relaxed text-gray-800",
                  !ticket.description?.trim() && "text-gray-500"
                )}
              >
                {displayDescription}
              </div>
            )}
          </section>

          <section className="mb-8">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
              <Paperclip className="size-4 text-gray-500" aria-hidden />
              Attachments
            </h3>
            {attachmentList.length === 0 ? (
              <p className="text-sm text-gray-500">
                {editing
                  ? "No attachments yet. Upload an image or paste an https link (max " +
                    MAX_UPLOAD_HINT +
                    " per file)."
                  : "No attachments."}
              </p>
            ) : (
              <AttachmentUrlList
                urls={attachmentList}
                readOnly={!editing}
                onRemoveUrl={editing ? (i) => setDraftAttachments((p) => p.filter((_, j) => j !== i)) : undefined}
              />
            )}
            {editing ? (
              <div className="mt-4 space-y-3 rounded-lg border border-dashed border-gray-200 bg-white px-3 py-3">
                <p className="text-xs text-gray-500">
                  Upload images (max {MAX_UPLOAD_HINT} each) or add an https link. While developing, the UI talks to
                  the API through Vite&apos;s proxy; set <code className="text-[11px]">VITE_API_URL</code> if you skip
                  the dev server proxy.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    size="sm"
                    type="url"
                    placeholder="https://…"
                    value={newAttachmentUrl}
                    onChange={(e) => setNewAttachmentUrl(e.target.value)}
                    className="min-w-[12rem] flex-1"
                    aria-label="Attachment URL"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addUrlAttachment}
                    disabled={ticketUploadBusy}
                  >
                    <Link2 className="mr-1 size-4" aria-hidden />
                    Add link
                  </Button>
                  <FilePickButton
                    variant="white"
                    size="sm"
                    aria-label="Upload attachment images"
                    accept="image/*"
                    busy={ticketUploadBusy}
                    onFilesSelected={(files) => void onPickTicketFiles(files)}
                  >
                    {ticketUploadBusy ? (
                      <>
                        <Loader2 className="mr-1 size-4 animate-spin" aria-hidden />
                        Uploading…
                      </>
                    ) : (
                      "Upload images"
                    )}
                  </FilePickButton>
                </div>
              </div>
            ) : null}
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-800">Comments</h3>
            {loadingComments ? (
              <p className="text-sm text-gray-500">Loading comments…</p>
            ) : commentsError ? (
              <p className="text-sm text-red-600">Could not load comments.</p>
            ) : comments && comments.length > 0 ? (
              <ul className="mb-4 flex flex-col gap-3">
                {comments.map((c) => {
                  const urls = normalizeAttachmentUrls(c.attachment_urls)
                  const when = c.created_at ? new Date(c.created_at).toLocaleString() : ""
                  return (
                    <li
                      key={c.id}
                      className="rounded-lg border border-gray-100 bg-gray-50/60 px-4 py-3 text-sm"
                    >
                      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-medium text-gray-900">
                          {c.user?.name ?? `User ${c.user_id}`}
                        </span>
                        <time className="text-xs text-gray-500" dateTime={c.created_at}>
                          {when}
                        </time>
                      </div>
                      {c.message?.trim() ? (
                        <p className="whitespace-pre-wrap text-gray-800">{c.message}</p>
                      ) : null}
                      {urls.length > 0 ? (
                        <div className={c.message?.trim() ? "mt-3" : ""}>
                          <AttachmentUrlList urls={urls} readOnly />
                        </div>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="mb-4 text-sm text-gray-500">No comments yet.</p>
            )}

            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <label htmlFor="ticket-comment-body" className="mb-1 block text-xs font-medium text-gray-600">
                Add a comment
              </label>
              <textarea
                id="ticket-comment-body"
                rows={3}
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Write a comment…"
                className={cn(
                  "mb-3 w-full resize-y rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition",
                  "focus-visible:ring-2 focus-visible:ring-[color:var(--app-focus-ring-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                )}
              />

              {(commentAttachments.length > 0 || commentUploadBusy || commentNewUrl.trim()) ? (
                <div className="mb-3">
                  <AttachmentUrlList
                    urls={commentAttachments}
                    onRemoveUrl={(i) =>
                      setCommentAttachments((prev) => prev.filter((_, j) => j !== i))
                    }
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Input
                      size="sm"
                      type="url"
                      placeholder="https://… attachment"
                      value={commentNewUrl}
                      onChange={(e) => setCommentNewUrl(e.target.value)}
                      className="min-w-[12rem] flex-1"
                      aria-label="Comment attachment URL"
                    />
                    <Button type="button" variant="secondary" size="sm" onClick={addCommentUrl}>
                      Add link
                    </Button>
                    <FilePickButton
                      variant="white"
                      size="sm"
                      aria-label="Attach images to comment"
                      accept="image/*"
                      busy={commentUploadBusy}
                      onFilesSelected={(files) => void onPickCommentFiles(files)}
                    >
                      {commentUploadBusy ? (
                        <>
                          <Loader2 className="mr-1 size-4 animate-spin" aria-hidden />
                          Upload…
                        </>
                      ) : (
                        <>
                          <Paperclip className="mr-1 size-4" aria-hidden />
                          Attach images
                        </>
                      )}
                    </FilePickButton>
                  </div>
                </div>
              ) : (
                <div className="mb-3 flex flex-wrap gap-2">
                  <FilePickButton
                    variant="white"
                    size="sm"
                    aria-label="Attach images to comment"
                    accept="image/*"
                    busy={commentUploadBusy}
                    onFilesSelected={(files) => void onPickCommentFiles(files)}
                  >
                    <Paperclip className="mr-1 size-4" aria-hidden />
                    Attach images
                  </FilePickButton>
                  <Input
                    size="sm"
                    type="url"
                    placeholder="Paste link…"
                    value={commentNewUrl}
                    onChange={(e) => setCommentNewUrl(e.target.value)}
                    className="min-w-[8rem] max-w-xs flex-1"
                  />
                  {commentNewUrl.trim() ? (
                    <Button type="button" variant="secondary" size="sm" onClick={addCommentUrl}>
                      Add link
                    </Button>
                  ) : null}
                </div>
              )}

              <Button
                type="button"
                variant="primary"
                size="sm"
                className="w-full sm:w-auto"
                disabled={postingComment}
                onClick={() => void submitComment()}
              >
                {postingComment ? (
                  <>
                    <Loader2 className="mr-1 size-4 animate-spin" aria-hidden />
                    Posting…
                  </>
                ) : (
                  <>
                    <SendHorizontal className="mr-1 size-4" aria-hidden />
                    Post comment
                  </>
                )}
              </Button>
            </div>
          </section>
        </div>
      </div>

      <aside className="w-full shrink-0 lg:w-72 xl:w-80">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:sticky lg:top-4">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Details
          </h3>
          <div className="divide-y divide-gray-100">
            <SidebarRow label="Priority">
              {editing ? (
                <Select
                  items={PRIORITIES}
                  value={draftPriority}
                  onChange={(v) => setDraftPriority(v)}
                  className="w-full"
                />
              ) : (
                priorityBadge(ticket.priority)
              )}
            </SidebarRow>
            <SidebarRow label="Status">
              {editing ? (
                <Select
                  items={STATUSES}
                  value={draftStatus}
                  onChange={(v) => setDraftStatus(v)}
                  className="w-full"
                />
              ) : (
                statusBadge(ticket.status)
              )}
            </SidebarRow>
            <SidebarRow label="Assignee">
              {editing ? (
                assigneeOptions.length > 0 ? (
                  <Select
                    items={assigneeOptions}
                    value={draftAssigneeId ?? undefined}
                    onChange={(v) => setDraftAssigneeId(Number(v))}
                    placeholder="Select assignee"
                    className="w-full"
                  />
                ) : (
                  <p className="text-sm text-amber-700">No project members loaded. Assign users to this project first.</p>
                )
              ) : (
                <div className="flex items-center gap-2">
                  <AssigneeAvatar
                    name={ticket.assignee?.name ?? "Unassigned"}
                    title={ticket.assignee?.name ?? "Unassigned"}
                    className="size-8 text-xs"
                  />
                  <span>{ticket.assignee?.name ?? "Unassigned"}</span>
                </div>
              )}
            </SidebarRow>
            <SidebarRow label="Issue type">
              {editing ? (
                <Select
                  items={ISSUE_TYPES}
                  value={draftIssueType}
                  onChange={(v) => setDraftIssueType(v)}
                  className="w-full"
                />
              ) : (
                issueTypeLabel(ticket.issue_type)
              )}
            </SidebarRow>
            <SidebarRow label="Start date">
              {editing ? (
                <Input
                  type="date"
                  size="sm"
                  value={draftStartDate}
                  onChange={(e) => setDraftStartDate(e.target.value)}
                  aria-label="Start date"
                />
              ) : (
                ticket.start_date ? new Date(ticket.start_date).toLocaleDateString() : "Not set"
              )}
            </SidebarRow>
            <SidebarRow label="End date">
              {editing ? (
                <Input
                  type="date"
                  size="sm"
                  value={draftEndDate}
                  onChange={(e) => setDraftEndDate(e.target.value)}
                  aria-label="End date"
                />
              ) : (
                ticket.end_date ? new Date(ticket.end_date).toLocaleDateString() : "Not set"
              )}
            </SidebarRow>
            {sprintName ? <SidebarRow label="Sprint">{sprintName}</SidebarRow> : null}
            {projectName ? <SidebarRow label="Project">{projectName}</SidebarRow> : null}
          </div>
        </div>
      </aside>
    </div>
  )
}
