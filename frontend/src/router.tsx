import {
    Outlet,
    RouterProvider,
    createRootRoute,
    createRoute,
    createRouter,
    redirect,
} from '@tanstack/react-router'
import AllUsers from './pages/allUsers'
import Home from './pages/home'
import SignUp from './pages/signUp'
import Login from './pages/login'
import { useAuthStore } from './stores/authStore'
import Dashboard from './pages/dashboard'
import { Navbar } from './components/Navbar'
import AllProjects from './pages/allProjects'
import { TicketingSystem } from './pages/addSprint'

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
          throw redirect({ to: "/dashboard" })
        }

        // if (user?.role != "admin" && path == "/all_users") {
        //     throw redirect({ to: "/dashboard" })
        // }
      },
})




function RootLayout() {
    return (
        <div >
            <Navbar />
            <Outlet />
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

const dashboardRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/dashboard',
    component: Dashboard,
})

const allProjectsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/all_projects',
    component: AllProjects,
})

const addSprintRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/add_sprint',
    component: TicketingSystem,
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
    dashboardRoute,
    allProjectsRoute,
    addSprintRoute,
    ticketingSystemRoute
])

export const router = createRouter({ routeTree })

export function AppRouter() {
    return <RouterProvider router={router} />
}
