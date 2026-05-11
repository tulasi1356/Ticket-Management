import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { FormProvider, useForm, useFormContext } from "react-hook-form"
import { FormInput } from "./form/formInput"
import { zodResolver } from "@hookform/resolvers/zod"
import { Drawer } from "./ui/sidebar"
import { Select } from "./ui/select"
import { ticketFormSchema } from "../types/ticket"
import type z from "zod"
import type { User } from "../types/user"
import { searchUsers } from "../api/userApi"
import { useCreateTicket } from "../hooks/tickets/useCreateTicket"
import { DatePicker } from "./ui/datePicker"
import { toast } from "sonner"



type TicketFormValues = z.infer<typeof ticketFormSchema>

function CreateTicketFields({
    sprintName,
    projectName,
    projectId,
    drawerOpen,
}: {
    sprintName: string
    projectName: string
    projectId: number
    drawerOpen: boolean
}) {
    const { control, watch, setValue } = useFormContext<TicketFormValues>()
    const status = watch("status")
    const issueType = watch("issueType")
    const priority = watch("priority")
    const startDate = watch("startDate")
    const endDate = watch("endDate")
    const assigneeId = watch("assigneeId")

    const [assigneeQuery, setAssigneeQuery] = useState("")
    const [assigneeHits, setAssigneeHits] = useState<User[]>([])
    const [assigneePicked, setAssigneePicked] = useState<User | null>(null)

    useEffect(() => {
        if (!drawerOpen) {
            setAssigneeQuery("")
            setAssigneeHits([])
            setAssigneePicked(null)
        }
    }, [drawerOpen])

    useEffect(() => {
        if (assigneeId == null) setAssigneePicked(null)
    }, [assigneeId])

    useEffect(() => {
        const q = assigneeQuery.trim()
        if (q.length <= 1) {
            setAssigneeHits([])
            return
        }
        const delayDebounce = setTimeout(() => {
            searchUsers(q, { projectId })
                .then(setAssigneeHits)
                .catch(() => setAssigneeHits([]))
        }, 300)

        return () => clearTimeout(delayDebounce)
    }, [assigneeQuery, projectId])

    const handleStatusChange = (value: string) => {
        setValue("status", value as "todo" | "in_progress" | "test" | "done", {
            shouldDirty: true,
            shouldValidate: true,
        })
    }
    const handleIssueTypeChange = (value: string) => {
        setValue("issueType", value as "bug" | "feature" | "task", {
            shouldDirty: true,
            shouldValidate: true,
        })
    }
    const handlePriorityChange = (value: string) => {
        setValue("priority", value as "low" | "medium" | "high", {
            shouldDirty: true,
            shouldValidate: true,
        })
    }

    const handleStartDateChange = (date?: Date) => {
        if (date && endDate && date > endDate) {
            toast.error("Start date cannot be after end date")
            return
        }
        setValue("startDate", date ? new Date(date) : undefined, { shouldDirty: true, shouldValidate: true })
    }
    const handleEndDateChange = (date?: Date) => {
        if (startDate && date && date < startDate) {
            toast.error("End date cannot be before start date")
            return
        }
        setValue("endDate", date ? new Date(date) : undefined, { shouldDirty: true, shouldValidate: true })
    }

    const clearAssignee = () => {
        setValue("assigneeId", undefined, { shouldDirty: true, shouldValidate: true })
        setAssigneePicked(null)
        setAssigneeQuery("")
        setAssigneeHits([])
    }

    return (
        <>
            <FormInput name="title" control={control} label="Title" placeholder="Title" />
            <FormInput name="description" control={control} label="Description" placeholder="Description"  type="textarea"/>
            <Select label="Status" items={[{ label: "Todo", value: "todo" }, { label: "In Progress", value: "in_progress" }, { label: "Test", value: "test" }, { label: "Done", value: "done" }]} value={status} onChange={handleStatusChange} placeholder="Status" />
            <Select label="Issue Type" items={[{ label: "Bug", value: "bug" }, { label: "Feature", value: "feature" }, { label: "Task", value: "task" }]} value={issueType} onChange={handleIssueTypeChange} placeholder="Issue Type" />
            <Select label="Priority" items={[{ label: "Low", value: "low" }, { label: "Medium", value: "medium" }, { label: "High", value: "high" }]} value={priority} onChange={handlePriorityChange} placeholder="Priority" />
            {/* start date */}
            <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Start Date</span>
                <DatePicker value={startDate ? new Date(startDate) : undefined} onChange={handleStartDateChange} placeholder="Start Date" />
            </div>
            {/* end date */}
            <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">End Date</span>
                <DatePicker value={endDate ? new Date(endDate) : undefined} onChange={handleEndDateChange} placeholder="End Date" />
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Sprint</span>
                <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
                    {sprintName}
                </p>
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Project</span>
                <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
                    {projectName}
                </p>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Assignee</label>
                {assigneePicked ? (
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="info" className="gap-1">
                            <span className="max-w-[220px] truncate">{assigneePicked.name}</span>
                            <button
                                type="button"
                                className="rounded p-0.5 hover:bg-blue-200"
                                aria-label="Clear assignee"
                                onClick={clearAssignee}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                        <button
                            type="button"
                            className="text-sm font-medium text-blue-600 hover:underline"
                            onClick={clearAssignee}
                        >
                            Change
                        </button>
                    </div>
                ) : (
                    <>
                        <input
                            type="text"
                            placeholder="Search assignee..."
                            value={assigneeQuery}
                            onChange={(e) => setAssigneeQuery(e.target.value)}
                            aria-label="Search assignee"
                            autoComplete="off"
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none ring-blue-500/20 placeholder:text-gray-400 focus:border-blue-400 focus:bg-white focus:ring-2"
                        />

                        {assigneeHits.length > 0 && (
                            <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                                {assigneeHits
                                    .filter((user) => user.id !== assigneeId)
                                    .map((user) => (
                                        <button
                                            key={user.id}
                                            type="button"
                                            className="flex w-full cursor-pointer flex-col gap-0.5 px-3 py-2 text-left text-sm hover:bg-gray-50"
                                            onClick={() => {
                                                setValue("assigneeId", user.id, {
                                                    shouldDirty: true,
                                                    shouldValidate: true,
                                                })
                                                setAssigneePicked(user)
                                                setAssigneeQuery("")
                                                setAssigneeHits([])
                                            }}
                                        >
                                            <span className="font-medium text-gray-900">{user.name}</span>
                                            <span className="text-xs text-gray-500">{user.email}</span>
                                        </button>
                                    ))}
                            </div>
                        )}
                    </>
                )}
            </div>
            
            {/* <FormInput name="comments" control={control} label="Comments" placeholder="Comments" /> */}
            {/* <FormInput name="attachments" control={control} label="Attachments" placeholder="Attachments" /> */}
        </>
    )
}

export function CreateTicket({
  projectId,
  projectName,
  sprintId,
  sprintName,
  triggerVariant = "secondary",
  triggerLabel = "Create Ticket",
  triggerClassName,
}: {
  projectId: number
  projectName: string
  sprintId: number
  sprintName: string
  triggerVariant?: "primary" | "secondary"
  triggerLabel?: string
  triggerClassName?: string
}) {
    const emptyDefaults = (): TicketFormValues => ({
        title: "",
        description: "",
        projectId,
        sprintId,
        assigneeId: undefined,
        status: "todo",
        issueType: "task",
        priority: "medium",
        comments: [],
        attachments: [],
    })

    const methods = useForm<TicketFormValues>({
        resolver: zodResolver(ticketFormSchema),
        defaultValues: emptyDefaults(),
    })
    const [open, setOpen] = useState(false)
    const { mutateAsync: createTicket } = useCreateTicket()

    useEffect(() => {
        methods.reset(emptyDefaults())
    }, [projectId, sprintId])

    const handleSubmit = async (data: TicketFormValues) => {
        const payload = {
            title: data.title,
            description: data.description,
            status: data.status,
            issue_type: data.issueType,
            priority: data.priority,
            start_date: data.startDate,
            end_date: data.endDate,
            project_id: data.projectId,
            sprint_id: data.sprintId,
            assignee_id: data.assigneeId!,
        }
        try {
            await createTicket(payload)
            setOpen(false)
            methods.reset(emptyDefaults())
        } catch (e) {
            console.error("Could not create ticket:", e)
        }
    }


    return (
        <div>
            <Button
              id = "create-ticket-button"
              aria-label="Create ticket"
              variant={triggerVariant}
              size={triggerVariant === "primary" ? "md" : "sm"}
              className={triggerClassName}
              onClick={() => setOpen(true)}
            >
              {triggerLabel}
            </Button>
            <Drawer open={open} onClose={() => setOpen(false)} ariaLabel="Create ticket">
                <div className="flex h-full flex-col pt-4">
                    <div className="border-b border-gray-200 px-4 pb-4 pr-12">
                        <h2 className="text-lg font-semibold text-gray-900">Create ticket</h2>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto p-4">
                        <FormProvider {...methods}>
                            <form
                                id="create-ticket-form"
                                className="flex flex-col gap-4"
                                onSubmit={methods.handleSubmit(handleSubmit)}
                            >
                                <CreateTicketFields
                                    sprintName={sprintName}
                                    projectName={projectName}
                                    projectId={projectId}
                                    drawerOpen={open}
                                />
                            </form>
                        </FormProvider>
                    </div>
                    <div className="border-t border-gray-200 p-4">
                        <Button
                            id="create-ticket-submit-footer"
                            aria-label="Create ticket"
                            type="submit"
                            form="create-ticket-form"
                            variant="primary"
                            className="w-full"
                        >
                            Create ticket
                        </Button>
                    </div>
                </div>
            </Drawer>
        </div>
    )
}