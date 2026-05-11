import { useEffect, useState } from "react"
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
import { UserMultiSelect } from "../components/UserMultiSelect"
import { DeleteIcon, EditIcon, Eye } from "lucide-react"
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
    const { mutateAsync: assignUsersMutation } = useAssignUsersToProject()
    const { data: project } = useGetProject(projectId ?? 0)
    const [createSelectedUserIds, setCreateSelectedUserIds] = useState<number[]>([])

    useEffect(() => {
        if (!isEdit || !open) return
        if (!project) return

        const selectedIds = (project.users ?? []).map((u: BasicUser) => u.id)
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
            const created = await createProject(data)
            const pid = Number(created.id)
            if (createSelectedUserIds.length && Number.isFinite(pid)) {
                await assignUsersMutation({
                    id: pid,
                    user_ids: createSelectedUserIds.map(Number),
                })
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
            const id = projectId ?? 0
            const updated = await editProject({ id, name: data.name, description: data.description })
            const pid = Number(updated.id ?? id)
            if (createSelectedUserIds.length && Number.isFinite(pid)) {
                await assignUsersMutation({
                    id: pid,
                    user_ids: createSelectedUserIds.map(Number),
                })
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
                            </button> :  <Button id = "create-project-button" aria-label="Create project" size="md" variant="primary" onClick={() => setOpen(true)}>Create Project</Button>
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
                                    browseWhenEmpty={(users ?? []) as BasicUser[]}
                                    resolveUsers={(users ?? []) as BasicUser[]}
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
            <div className="flex min-h-[calc(100vh-57px)] w-full flex-col bg-gray-50/80">
                <header className="border-b border-gray-200 bg-white px-6 py-4">
                    <p className="text-xs text-gray-500">Projects</p>
                    <h1 className="text-lg font-semibold text-gray-900">Projects</h1>
                </header>
                <div className="flex flex-1 items-center justify-center px-6 py-6">
                    <Card className="w-full max-w-xl">
                        <CardHeader>
                            <CardTitle>Sign in required</CardTitle>
                            <CardDescription>
                                You must be logged in to view this page.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        )
    }

    if (isLoading || (isAdmin && isuserdataLoading)) {
        return (
            <div className="flex min-h-[calc(100vh-57px)] w-full flex-col bg-gray-50/80">
                <header className="border-b border-gray-200 bg-white px-6 py-4">
                    <p className="text-xs text-gray-500">Projects</p>
                    <h1 className="text-lg font-semibold text-gray-900">Projects</h1>
                </header>
                <div className="flex flex-1 items-center justify-center px-6 py-6 text-sm text-gray-500">
                    Loading...
                </div>
            </div>
        )
    }

    if (error) {
        console.error("Error fetching projects:", error)
        return (
            <div className="flex min-h-[calc(100vh-57px)] w-full flex-col bg-gray-50/80">
                <header className="border-b border-gray-200 bg-white px-6 py-4">
                    <p className="text-xs text-gray-500">Projects</p>
                    <h1 className="text-lg font-semibold text-gray-900">Projects</h1>
                </header>
                <div className="flex flex-1 items-center justify-center px-6 py-6">
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        Could not load projects.
                    </div>
                </div>
            </div>
        )
    }

    if (isAdmin && erroruser) {
        console.error("Error fetching users:", erroruser)
        return (
            <div className="flex min-h-[calc(100vh-57px)] w-full flex-col bg-gray-50/80">
                <header className="border-b border-gray-200 bg-white px-6 py-4">
                    <p className="text-xs text-gray-500">Projects</p>
                    <h1 className="text-lg font-semibold text-gray-900">Projects</h1>
                </header>
                <div className="flex flex-1 items-center justify-center px-6 py-6">
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        Could not load users.
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-[calc(100vh-57px)] w-full flex-col bg-gray-50/80">
            <header className="flex shrink-0 flex-wrap items-start justify-between gap-4 border-b border-gray-200 bg-white px-6 py-4">
                <div>
                    <p className="text-xs text-gray-500">Projects</p>
                    <h1 className="text-lg font-semibold text-gray-900">Projects</h1>
                    <p className="mt-0.5 text-sm text-gray-600">
                        {isAdmin ? "Create projects and manage team access." : "View your projects."}
                    </p>
                </div>
                {isAdmin ? (
                    <div className="flex flex-wrap items-center gap-2">
                        <CreateOrEditProject isEdit={false} onClose={() => {}} />
                    </div>
                ) : null}
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
                <Card>
                    <CardHeader className="border-b border-gray-100 pb-4">
                        <CardTitle className="text-base font-semibold text-gray-900">
                            {isAdmin ? "All projects" : "My projects"}
                        </CardTitle>
                        <CardDescription>
                            {isAdmin ? "View existing projects and assign users." : "Projects you have access to."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {data && data.length > 0 ? (
                            <Table size="sm">
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                            Name
                                        </TableHead>
                                        <TableHead className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                            Description
                                        </TableHead>
                                        {isAdmin ? (
                                            <TableHead className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                Assign users
                                            </TableHead>
                                        ) : null}
                                        <TableHead className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                            Actions
                                        </TableHead>
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
                                                                    size="sm"
                                                                    type="text"
                                                                    placeholder="Assign users..."
                                                                    className="rounded-lg border-gray-200 bg-gray-50 text-sm focus:bg-white"
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
                                                                    browseWhenEmpty={(users ?? []) as BasicUser[]}
                                                                    resolveUsers={(users ?? []) as BasicUser[]}
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
                                            <TableCell>
                                                {isAdmin ? (
                                                    <div className="flex items-center gap-2">
                                                        <CreateOrEditProject isEdit={true} projectId={project.id} onClose={() => setAssignUsersProjectId(null)} />
                                                        <button type="button" id = "delete-project-button" aria-label="Delete project" onClick={() => handleDeleteProject(project.id)}>
                                                            <DeleteIcon id = "delete-project-button" onClick={() => handleDeleteProject(project.id)} className="size-4 cursor-pointer text-gray-500 hover:text-gray-800" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        id="view-board-button"
                                                        aria-label="View board"
                                                        variant="secondary"
                                                        size="sm"
                                                        className="gap-1.5 border border-gray-200 bg-white text-gray-700 shadow-none hover:bg-gray-50"
                                                        onClick={() =>
                                                            router.navigate({
                                                                to: "/ticketing_system",
                                                                search: { projectId: project.id },
                                                            })
                                                        }
                                                    >
                                                        <Eye className="size-4" />
                                                        View board
                                                    </Button>
                                                )}
                                            </TableCell> 
                                        </TableRow>
                                    )
                                    )}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="flex min-h-[160px] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/50 text-center text-sm text-gray-500">
                                No projects found.
                            </div>
                        )}
                    </CardContent>
                </Card>
                </div>
            </div>
        </div>

        
    )
}
