import { useEffect, useState } from "react"
import { Button } from "./ui/button"
import { FormProvider, useForm, useFormContext } from "react-hook-form"
import { FormInput } from "./form/formInput"
import { zodResolver } from "@hookform/resolvers/zod"
import { Drawer } from "./ui/sidebar"
import { Select } from "./ui/select"
import { ticketFormSchema } from "../types/ticket"
import type z from "zod"
import type { User } from "../types/user"
import { useCreateTicket } from "../hooks/tickets/useCreateTicket"



type TicketFormValues = z.infer<typeof ticketFormSchema>

function CreateTicketFields({
    sprintName,
    projectName,
    drawerOpen,
}: {
    sprintName: string
    projectName: string
    drawerOpen: boolean
}) {
    const { control, watch, setValue } = useFormContext<TicketFormValues>()
    const status = watch("status")
    const issueType = watch("issueType")
    const priority = watch("priority")

    const [query, setQuery] = useState("")
    const [users, setUsers] = useState<User[]>([])

    useEffect(() => {
        if (!drawerOpen) {
            setQuery("")
            setUsers([])
        }
    }, [drawerOpen])

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
          if (query.length > 1) {
            fetch(`http://localhost:3000/users/search?query=${query}`)
              .then(res => res.json())
              .then(data => setUsers(data))
          }
        }, 300)
      
        return () => clearTimeout(delayDebounce)
      }, [query])
    
    
    
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

    return (
        <>
            <FormInput name="title" control={control} label="Title" placeholder="Title" />
            <FormInput name="description" control={control} label="Description" placeholder="Description"  type="textarea"/>
            <Select label="Status" items={[{ label: "Todo", value: "todo" }, { label: "In Progress", value: "in_progress" }, { label: "Test", value: "test" }, { label: "Done", value: "done" }]} value={status} onChange={handleStatusChange} placeholder="Status" />
            <Select label="Issue Type" items={[{ label: "Bug", value: "bug" }, { label: "Feature", value: "feature" }, { label: "Task", value: "task" }]} value={issueType} onChange={handleIssueTypeChange} placeholder="Issue Type" />
            <Select label="Priority" items={[{ label: "Low", value: "low" }, { label: "Medium", value: "medium" }, { label: "High", value: "high" }]} value={priority} onChange={handlePriorityChange} placeholder="Priority" />
            <FormInput disabled name="sprintId" value={sprintName} control={control} label="Sprint ID" placeholder="Sprint ID" />
            <FormInput disabled name="projectId" value={projectName} control={control} label="Project ID" placeholder="Project ID" />

            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Assignee</label>
                <input
                    type="text"
                    placeholder="Search assignee..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="border p-2 rounded-md"
                />

                {users.length > 0 && (
                    <div className="border mt-1 bg-white shadow rounded-md overflow-hidden">
                        {users.map((user) => (
                            <div
                                key={user.id}
                                className="p-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => {
                                    setValue("assigneeId", user.id, { shouldDirty: true, shouldValidate: true })
                                    setQuery(user.name)
                                    setUsers([])
                                }}
                            >
                                {user.name} ({user.email})
                            </div>
                        ))}
                    </div>
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
            <Drawer open={open} onClose={() => setOpen(false)}>
                <div className="flex h-full flex-col">
                    <div className="border-b px-4 py-3">
                        <h2 className="text-lg font-semibold">Create Ticket</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        <FormProvider {...methods}>
                            <form className="flex flex-col gap-4" onSubmit={methods.handleSubmit(handleSubmit)}>
                                <CreateTicketFields
                                    sprintName={sprintName}
                                    projectName={projectName}
                                    drawerOpen={open}
                                />
                                <Button id = "create-ticket-button" aria-label="Create ticket" type="submit">Create Ticket</Button>
                            </form>
                        </FormProvider>
                    </div>
                </div>
                <div className="border-t p-4">
                    <Button id = "create-ticket-button" aria-label="Create ticket" type="submit" onClick={methods.handleSubmit(handleSubmit)}>Create Ticket</Button>
                </div>
            </Drawer>
        </div>
    )
}