import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { useUsers } from "../hooks/users/useUsers"
import { useAuthStore } from "../stores/authStore"

export default function AllUsers() {
    const user = useAuthStore((s) => s.user)
    const isAdmin = user?.role === "admin"
    const { data, error, isLoading } = useUsers(isAdmin)

    if (!user) {
        return (
            <div className="flex min-h-[calc(100vh-57px)] w-full flex-col bg-gray-50/80">
                <header className="border-b border-gray-200 bg-white px-6 py-4">
                    <p className="text-xs text-gray-500">Users</p>
                    <h1 className="text-lg font-semibold text-gray-900">Users</h1>
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

    if (!isAdmin) {
        return (
            <div className="flex min-h-[calc(100vh-57px)] w-full flex-col bg-gray-50/80">
                <header className="border-b border-gray-200 bg-white px-6 py-4">
                    <p className="text-xs text-gray-500">Users</p>
                    <h1 className="text-lg font-semibold text-gray-900">Users</h1>
                </header>
                <div className="flex flex-1 items-center justify-center px-6 py-6">
                    <Card className="w-full max-w-xl">
                        <CardHeader>
                            <CardTitle>Access denied</CardTitle>
                            <CardDescription>
                                Only administrators can view the user directory.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="flex min-h-[calc(100vh-57px)] w-full flex-col bg-gray-50/80">
                <header className="border-b border-gray-200 bg-white px-6 py-4">
                    <p className="text-xs text-gray-500">Users</p>
                    <h1 className="text-lg font-semibold text-gray-900">Users</h1>
                </header>
                <div className="flex flex-1 items-center justify-center px-6 py-6 text-sm text-gray-500">
                    Loading...
                </div>
            </div>
        )
    }

    if (error) {
        console.error("Error fetching users:", error)
        return (
            <div className="flex min-h-[calc(100vh-57px)] w-full flex-col bg-gray-50/80">
                <header className="border-b border-gray-200 bg-white px-6 py-4">
                    <p className="text-xs text-gray-500">Users</p>
                    <h1 className="text-lg font-semibold text-gray-900">Users</h1>
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
                    <p className="text-xs text-gray-500">Users</p>
                    <h1 className="text-lg font-semibold text-gray-900">Users</h1>
                    <p className="mt-0.5 text-sm text-gray-600">
                        View everyone in the organization and their roles.
                    </p>
                </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
                    <Card>
                        <CardHeader className="border-b border-gray-100 pb-4">
                            <CardTitle className="text-base font-semibold text-gray-900">
                                All users
                            </CardTitle>
                            <CardDescription>
                                Names, emails, and permission levels.
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
                                                Email
                                            </TableHead>
                                            <TableHead className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                Role
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.map((u) => (
                                            <TableRow key={u.id}>
                                                <TableCell className="font-medium">{u.name}</TableCell>
                                                <TableCell className="text-gray-700">{u.email}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={u.role === "admin" ? "warning" : "secondary"}
                                                        size="xs"
                                                    >
                                                        {u.role === "normal" ? "Employee" : "Admin"}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="flex min-h-[160px] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/50 text-center text-sm text-gray-500">
                                    No users found.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
