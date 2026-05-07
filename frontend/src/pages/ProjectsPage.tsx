import { useEffect, useMemo, useState } from "react"
import { Button } from "../components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table"
import { useProjects } from "../hooks/projects/useProjects"
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { FormProvider, useForm, useFormContext } from "react-hook-form"
import { FormInput } from "../components/form/formInput"
import { useAuthStore } from "../stores/authStore"
import { useCreateProject } from "../hooks/projects/useCreateProject"
import { useAssignUsersToProject } from "../hooks/projects/useAssignUsersToProject"
import { useUsers } from "../hooks/users/useUsers"
import { Input } from "../components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { searchUsers } from "../api/userApi"
import { Check, DeleteIcon, EditIcon, Search, X } from "lucide-react"
import { assignUsersToProject } from "../api/projectApi"
import { useEditProject } from "../hooks/projects/useEditProject"
import { useGetProject } from "../hooks/projects/useGetProject"
import type { Project } from "./ticketing/types"
import { useDeleteProject } from "../hooks/projects/useDeleteProject"
import { router } from "../router"

const projectFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    user_ids: z.array(z.number()).optional(),
})

type ProjectFormValues = z.infer<typeof projectFormSchema> 

function CreateProjectForm({ isEdit = false }: { isEdit?: boolean, project?: Project }) {
    const {control} = useFormContext<ProjectFormValues>()

    return (
     <>
        <FormInput name="name" control={control} label={isEdit ? "Name" : "Name"} placeholder="Name" />
        <FormInput name="description" control={control} label={isEdit ? "Description" : "Description"} placeholder="Description" />
     </>
    )
}

type BasicUser = { id: number; name: string; email?: string }

function UserMultiSelect({
    value,
    onChange,
    allUsers,
    placeholder = "Search users...",
}: {
    value: number[]
    onChange: (next: number[]) => void
    allUsers: BasicUser[]
    placeholder?: string
}) {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<BasicUser[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        let cancelled = false
        const trimmed = query.trim()

        if (!trimmed) {
            setResults(allUsers.slice(0, 10))
            return
        }

        const timer = setTimeout(async () => {
            setLoading(true)
            try {
                const data = await searchUsers(trimmed)
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
    }, [query, allUsers])

    const selectedUsers = useMemo(() => {
        const byId = new Map(allUsers.map((u) => [u.id, u]))
        return value.map((id) => byId.get(id)).filter(Boolean) as BasicUser[]
    }, [allUsers, value])

    const toggle = (id: number) => {
        if (value.includes(id)) onChange(value.filter((x) => x !== id))
        else onChange([...value, id])
    }

    return (
        <div className="flex flex-col gap-2">
            {selectedUsers.length ? (
                <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((u) => (
                        <Badge key={u.id} variant="info" className="gap-1">
                            <span className="max-w-[180px] truncate">{u.name}</span>
                            <button
                                id = "remove-user-button"
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
                />
            </div>

            <div className="max-h-56 overflow-y-auto rounded-md border bg-white">
                {loading ? (
                    <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>
                ) : results.length ? (
                    results.map((u) => {
                        const checked = value.includes(u.id)
                        return (
                            <button
                                id = "select-user-button"
                                aria-label={`Select ${u.name}`}
                                key={u.id}
                                type="button"
                                onClick={() => toggle(u.id)}
                                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50"
                            >
                                <div className="min-w-0">
                                    <div className="truncate font-medium text-gray-900">{u.name}</div>
                                    {u.email ? (
                                        <div className="truncate text-xs text-gray-500">{u.email}</div>
                                    ) : null}
                                </div>
                                <span
                                    className={
                                        "flex h-5 w-5 items-center justify-center rounded border " +
                                        (checked
                                            ? "border-blue-600 bg-blue-600 text-white"
                                            : "border-gray-300 bg-white text-transparent")
                                    }
                                >
                                    <Check className="h-3.5 w-3.5" />
                                </span>
                            </button>
                        )
                    })
                ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">No users found.</div>
                )}
            </div>
        </div>
    )
}

type CreateOrEditProjectProps = {
    isEdit?: boolean
    projectId?: number
    onClose: () => void
}

export function CreateOrEditProject({ isEdit = false, projectId, onClose }: CreateOrEditProjectProps) {
    const [open, setOpen] = useState(false)
    const user = useAuthStore((s) => s.user)
    const isAdmin = user?.role === "admin"
    const methods = useForm<ProjectFormValues>({
        resolver: zodResolver(projectFormSchema),
        defaultValues: {
            name: "",
            description: "",
            user_ids: [],
        },
    })
    const { data: users } = useUsers(!!isAdmin)
    const { mutateAsync: createProject } = useCreateProject()
    const { mutateAsync: editProject } = useEditProject()
    const { data: project } = useGetProject(projectId ?? 0)
    const [createSelectedUserIds, setCreateSelectedUserIds] = useState<number[]>([])

    useEffect(() => {
        if (!isEdit || !open) return
        if (!project) return

        const selectedIds = (project.users ?? []).map((u) => u.id)
        methods.reset({
            name: project.name ?? "",
            description: project.description ?? "",
            user_ids: selectedIds,
        })
        setCreateSelectedUserIds(selectedIds)
    }, [isEdit, open, project, methods])

    useEffect(() => {
        if (isEdit) return
        if (!open) return
        methods.reset({ name: "", description: "", user_ids: [] })
        setCreateSelectedUserIds([])
    }, [isEdit, open, methods])



    const handleSubmit = async (data: ProjectFormValues) => {
        try {
            const project = await createProject(data)
            if (createSelectedUserIds.length) {
                await assignUsersToProject({ id: project.id, user_ids: createSelectedUserIds })
            }
            methods.reset()
            setCreateSelectedUserIds([])
            setOpen(false)
        } catch (e) {
            console.error("Error creating project:", e)
        }
    }

    const handleEditSubmit = async (data: ProjectFormValues) => {
        try {
            const updated = await editProject({ id: projectId ?? 0, name: data.name, description: data.description })
            if (createSelectedUserIds.length) {
                await assignUsersToProject({ id: updated.id, user_ids: createSelectedUserIds })
            }
            methods.reset()
            setCreateSelectedUserIds([])
            setOpen(false)
            onClose()
        } catch (e) {
            console.error("Error editing project:", e)
        }
    }
    
    return (
        <>
        {isAdmin ? (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    {
                        isEdit ?  <button type="button" id = "edit-project-button" aria-label="Edit project" onClick={() => setOpen(true)}>
                            <EditIcon id = "edit-project-button" onClick={() => setOpen(true)} className="size-4 cursor-pointer" />
                            </button> :  <Button id = "create-project-button" aria-label="Create project" onClick={() => setOpen(true)}>Create Project</Button>
                    }
                   
                </PopoverTrigger>
                <PopoverContent size="lg" align="end">
                    <FormProvider {...methods}>
                        <form className="flex flex-col gap-4" onSubmit={isEdit ? methods.handleSubmit(handleEditSubmit) : methods.handleSubmit(handleSubmit)}>
                            <CreateProjectForm isEdit={isEdit} project={project} />
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium">Assign users (optional)</span>
                                <UserMultiSelect
                                    value={createSelectedUserIds}
                                    onChange={setCreateSelectedUserIds}
                                    allUsers={(users ?? []) as BasicUser[]}
                                    placeholder="Search and select users..."
                                />
                            </div>
                            <Button id = "submit-project-button" aria-label={isEdit ? "Edit Project" : "Create Project"} type="submit">{isEdit ? "Edit Project" : "Create Project"}</Button>
                        </form>
                    </FormProvider>
                </PopoverContent>
            </Popover>
        ) : null}
    </>
    )
}



export default function AllProjects() {
    const [assignUsersProjectId, setAssignUsersProjectId] = useState<number | null>(null)
    const user = useAuthStore((s) => s.user)
    const isAdmin = user?.role === "admin"
    const { data, error, isLoading } = useProjects(!!user)

    const { data: users, error: erroruser, isLoading: isuserdataLoading } = useUsers(!!isAdmin)
    
    const { mutateAsync: assignUsersToProject, isPending: isAssigning } = useAssignUsersToProject()
    
    const [assignSelectedUserIds, setAssignSelectedUserIds] = useState<number[]>([])

    const { mutateAsync: deleteProject } = useDeleteProject()

    const handleDeleteProject = async (id: number) => {
        try {
            await deleteProject(id)
        } catch (e) {
            console.error("Error deleting project:", e)
            // toast.error("Error deleting project")
        }
    }
    

   

    if (!user) {
        return (
            <div className="flex min-h-[calc(100vh-57px)] items-center justify-center bg-gray-50 p-6">
                <Card className="w-full max-w-xl">
                    <CardHeader>
                        <CardTitle>Projects</CardTitle>
                        <CardDescription>
                            You must be logged in to view this page.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    if (isLoading || (isAdmin && isuserdataLoading)) {
        return (
            <div className="flex min-h-[calc(100vh-57px)] items-center justify-center bg-gray-50 p-6 text-gray-500">
                Loading...
            </div>
        )
    }

    if (error) {
        console.error("Error fetching projects:", error)
        return (
            <div className="flex min-h-[calc(100vh-57px)] items-center justify-center bg-gray-50 p-6">
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Could not load projects.
                </div>
            </div>
        )
    }

    if (isAdmin && erroruser) {
        console.error("Error fetching users:", erroruser)
        return (
            <div className="flex min-h-[calc(100vh-57px)] items-center justify-center bg-gray-50 p-6">
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Could not load users.
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-57px)] w-full bg-gray-50 p-6">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
                        <p className="text-sm text-gray-600">
                            {isAdmin ? "Create projects and manage team access." : "View your projects."}
                        </p>
                    </div>
                    {isAdmin ? (
                        <CreateOrEditProject isEdit={false} onClose={() => {}} />
                    ) : 
                    null
                    }
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{isAdmin ? "All projects" : "My projects"}</CardTitle>
                        <CardDescription>
                            {isAdmin ? "View existing projects and assign users." : "Projects you have access to."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data && data.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Description</TableHead>
                                        {isAdmin ? <TableHead>Assign Users</TableHead> : null}
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map(
                                        (project: {
                                            id: number
                                            name: string
                                            description: string
                                            users?: BasicUser[]
                                        }) => (
                                        <TableRow key={project.id}>
                                            <TableCell className="font-medium">{project.name}</TableCell>
                                            <TableCell className="text-gray-700">{project.description}</TableCell>
                                            {isAdmin ? (
                                                <TableCell>
                                                    <Popover
                                                        open={assignUsersProjectId === project.id}
                                                        onOpenChange={(nextOpen) => {
                                                            if (!nextOpen) {
                                                                setAssignUsersProjectId(null)
                                                                setAssignSelectedUserIds([])
                                                            }
                                                        }}
                                                    >
                                                        <PopoverTrigger asChild>
                                                            <button
                                                                id = "assign-users-button"
                                                                aria-label="Assign users"
                                                                type="button"
                                                                className="w-full"
                                                                onClick={() => {
                                                                    // Preload current assignment before opening the popover
                                                                    setAssignUsersProjectId(project.id)
                                                                    setAssignSelectedUserIds(
                                                                        (project.users ?? []).map((u) => u.id)
                                                                    )
                                                                }}
                                                            >
                                                                <Input
                                                                    readOnly
                                                                    type="text"
                                                                    placeholder="Assign users..."
                                                                    value={
                                                                        assignUsersProjectId === project.id
                                                                            ? assignSelectedUserIds.length
                                                                                ? `${assignSelectedUserIds.length} selected`
                                                                                : ""
                                                                            : (project.users ?? []).length
                                                                                ? `${(project.users ?? []).length} assigned`
                                                                                : ""
                                                                    }
                                                                />
                                                            </button>
                                                        </PopoverTrigger>
                                                        <PopoverContent size="lg" align="start">
                                                            <div className="flex flex-col gap-3">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    Assign users
                                                                </div>
                                                                <UserMultiSelect
                                                                    value={assignSelectedUserIds}
                                                                    onChange={setAssignSelectedUserIds}
                                                                    allUsers={(users ?? []) as BasicUser[]}
                                                                    placeholder="Search users..."
                                                                />
                                                                <div className="flex justify-end gap-2 pt-1">
                                                                    <Button
                                                                        id = "cancel-assign-users-button"
                                                                        aria-label="Cancel assign users"
                                                                        type="button"
                                                                        variant="secondary"
                                                                        size="sm"
                                                                        onClick={() => setAssignUsersProjectId(null)}
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                    <Button
                                                                        id = "save-assign-users-button"
                                                                        aria-label="Save assign users"
                                                                        type="button"
                                                                        size="sm"
                                                                        disabled={isAssigning}
                                                                        onClick={async () => {
                                                                            try {
                                                                                await assignUsersToProject({
                                                                                    id: project.id,
                                                                                    user_ids: assignSelectedUserIds,
                                                                                })
                                                                                setAssignUsersProjectId(null)
                                                                                setAssignSelectedUserIds([])
                                                                            } catch (e) {
                                                                                console.error("Assign users failed:", e)
                                                                            }
                                                                        }}
                                                                    >
                                                                        {isAssigning ? "Saving..." : "Save"}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                </TableCell>
                                            ) : null}
                                            <TableCell className="flex gap-2 mt-3">
                                                {isAdmin ? (
                                                    <div className="flex items-center gap-2">
                                                        <CreateOrEditProject isEdit={true} projectId={project.id} onClose={() => setAssignUsersProjectId(null)} />
                                                        <button type="button" id = "delete-project-button" aria-label="Delete project" onClick={() => handleDeleteProject(project.id)}>
                                                            <DeleteIcon id = "delete-project-button" onClick={() => handleDeleteProject(project.id)} className="size-4 cursor-pointer" />
                                                        </button>
                                                    </div>
                                                ) : 
                                                <Button id = "view-updates-button" onClick={() => router.navigate({ to: "/add_sprint" })}>View Updates</Button>
                                                }
                                            </TableCell> 
                                        </TableRow>
                                    )
                                    )}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="flex min-h-[120px] items-center justify-center text-sm text-gray-600">
                                No projects found.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>

        
    )
}
