import {
    Outlet,
    RouterProvider,
    createRootRoute,
    createRoute,
    createRouter,
    redirect,
} from '@tanstack/react-router'
import AllUsers from './pages/UsersPage'
import Home from './pages/HomePage'
import SignUp from './pages/SignUpPage'
import Login from './pages/LoginPage'
import { useAuthStore } from './stores/authStore'
import AllProjects from './pages/ProjectsPage'
import { TicketingSystem } from './pages/ticketing/TicketingSystem'
import { Navbar } from './components/navbar'

const rootRoute = createRootRoute({
    component: RootLayout,


    beforeLoad: ({ location }) => {
        const user = useAuthStore.getState().user
        const path = location.pathname
    
        const isAuthPage = path === "/login" || path === "/signup"
    
        // 🚫 Not logged in → block protected pages
        if (!user && !isAuthPage) {
          throw redirect({ to: "/signup" })
        }
    
        // 🚫 Logged in → block login/signup
        if (user && isAuthPage) {
          throw redirect({ to: "/ticketing_system" })
        }

      },
})




function RootLayout() {
    return (
        <div className="flex min-h-screen flex-col">
            <a className="skip-to-main" href="#main-content">
                Skip to main content
            </a>
            <Navbar />
            <main
                id="main-content"
                tabIndex={-1}
                className="flex min-h-0 flex-1 flex-col outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--app-focus-ring-color)]"
            >
                <Outlet />
            </main>
        </div>
    )
}

const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: Home,
})

const signUpRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/signup',
    component: SignUp,
})

const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    component: Login,
})

const allUsersRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/all_users',
    component: AllUsers,
})

const allProjectsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/all_projects',
    component: AllProjects,
})


const ticketingSystemRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/ticketing_system',
    component: TicketingSystem,
})

const routeTree = rootRoute.addChildren([
    indexRoute,
    loginRoute,
    signUpRoute,
    allUsersRoute,  
    allProjectsRoute,
    ticketingSystemRoute
])

export const router = createRouter({ routeTree })

export function AppRouter() {
    return <RouterProvider router={router} />
}
