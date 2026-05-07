import { Link } from "@tanstack/react-router"
import { useAuthStore } from "../stores/authStore"
import { LogOutIcon, TicketIcon, UsersIcon } from "lucide-react"
import { Tooltip } from "./ui/tooltip"
import { AssigneeAvatar } from "./ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"


export function Navbar() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logOut)

  return (
    <header className="border-b bg-white">
      <div className=" flex items-center justify-between gap-4 p-4">
        <Link to="/" className="font-semibold tracking-tight">
          <div className="flex items-center gap-2">
            <TicketIcon className="size-6 text-blue-500" />
            <span className="text-xl font-bold">Ticket App</span>
          </div>
        </Link>

        {user ? (
          <div className="flex items-center gap-3">
            <nav className="flex items-center gap-3 text-sm">
              {user.role === "admin" ? (
                <>
                  <Link id = "users-link" aria-label="Users" to="/all_users" className="hover:underline">
                    <div className="flex items-center gap-1">
                      <UsersIcon className="size-4" />
                      <span className="text-sm">Users</span>
                    </div>
                  </Link>
                  <Link to="/all_projects" id = "projects-link" aria-label="Projects" className="hover:underline">
                    Projects
                  </Link>
                  <Link to="/ticketing_system" id = "all-tickets-link" aria-label="All tickets" className="hover:underline">
                    All Tickets
                  </Link>
                </>
              ) : (
                <Link  to="/all_projects" id = "my-projects-link" aria-label="My projects" className="hover:underline">
                  My Projects
                </Link>
              )}
            </nav>

            <div className="hidden items-center gap-2 sm:flex">
              {user.role === "admin" ? (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                      Admin
                    </span>
                  ) : null}
              <Tooltip content={user.name}>
                <div className="flex items-center gap-1 cursor-pointer"> 
                  <Popover >
                    <PopoverTrigger>
                      <AssigneeAvatar name={user.name} size="sm" />
                    </PopoverTrigger>
                    <PopoverContent>
                    <button
                      id = "logout-button"
                      aria-label="Logout"
                      onClick={logout}
                      className="text-sm flex items-center gap-1"
                    >
                      <LogOutIcon className="size-4" />
                      <span className="text-sm">Logout</span>
                    </button>
                    </PopoverContent>
                  </Popover>
                </div>
              </Tooltip>
            </div>

          
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <Link to="/login" className="rounded-md px-3 py-1.5 hover:bg-gray-50">
              Login
            </Link>
            <Link
              to="/signup"
              className="rounded-md border px-3 py-1.5 hover:bg-gray-50"
            >
              Signup
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}