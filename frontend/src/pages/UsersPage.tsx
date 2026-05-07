import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { useUsers } from "../hooks/users/useUsers"
import { useAuthStore } from "../stores/authStore"

export default function AllUsers() {
    const user = useAuthStore((s) => s.user)
    const isAdmin = user?.role === "admin"
    const { data, error, isLoading } = useUsers(isAdmin)

    if (!isAdmin) {
        return <div className="p-6 text-sm text-gray-600">Forbidden: admin only.</div>
    }

    if (isLoading) {
        return <div>Loading...</div>
    }

    if (error) {
        console.error("Error fetching users:", error)
        return <div>Could not load users.</div>
    }

    return (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
    )

}