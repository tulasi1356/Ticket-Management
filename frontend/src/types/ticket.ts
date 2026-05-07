import z from "zod"

export const ticketFormSchema = z
    .object({
        title: z.string().min(1, "Title is required"),
        description: z.string().min(1, "Description is required"),
        projectId: z.number().min(1, "Project ID is required"),
        sprintId: z.number().min(1, "Sprint ID is required"),
        assigneeId: z.number().optional(),
        issueType: z.enum(["bug", "feature", "task"]),
        priority: z.enum(["low", "medium", "high"]),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        status: z.enum(["todo", "in_progress", "test", "done"]),
        comments: z.array(z.object({
            content: z.string().min(1, "Comment is required"),
            userId: z.number().min(1, "User ID is required"),
        })),
        attachments: z.array(z.object({
            url: z.string().min(1, "Attachment URL is required"),
            userId: z.number().min(1, "User ID is required"),
        })),
    })
    .refine((data) => data.assigneeId != null && data.assigneeId >= 1, {
        message: "Assignee is required",
        path: ["assigneeId"],
    })

export type TicketForm = z.infer<typeof ticketFormSchema>