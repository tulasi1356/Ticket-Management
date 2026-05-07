import { z } from "zod"

export const userSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.email(),
    role: z.enum(['normal', 'admin']),
})

export type User = z.infer<typeof userSchema>