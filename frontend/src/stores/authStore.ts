import { create } from "zustand"
import type { User } from "../types/user"
import { immer } from "zustand/middleware/immer"

const USER_SESSION_KEY = "user"

function readStoredUser(): User | null {
    try {
        const raw = sessionStorage.getItem(USER_SESSION_KEY)
        if (!raw) return null
        return JSON.parse(raw) as User
    } catch {
        return null
    }
}

type AuthState = {
    user: User | null
    setUser: (user: User | null) => void,
    logOut: () => void,
}

export const useAuthStore = create<AuthState>() (
    immer((set) => ({
        user: readStoredUser(),
        setUser: (user) => set((state) => {
            state.user = user
            if (user === null) {
                sessionStorage.removeItem(USER_SESSION_KEY)
            } else {
                sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(user))
            }
        }),
        logOut: () => set((state) => {
            state.user = null
            sessionStorage.removeItem(USER_SESSION_KEY)
        }),
    }))
)