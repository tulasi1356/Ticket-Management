import { useMemo, useState } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { FormProvider, useForm, useFormContext } from "react-hook-form"
import { z } from "zod"
import { FormInput } from "../components/form/formInput"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "../components/ui/button"
import { findUserByEmail } from "../api/userApi"
import { useAuthStore } from "../stores/authStore"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card"

export const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(8),
})

type LoginFormValues = z.infer<typeof loginSchema>

function LoginFields() {
    const { control } = useFormContext<LoginFormValues>()

    return (
        <>
            <FormInput
                name="email"
                control={control}
                label="Email"
                placeholder="Enter your email"
                size="lg"
            />
            <FormInput
                type="password"
                name="password"
                control={control}
                label="Password"
                placeholder="Enter your password"
                size="lg"
            />
        </>
    )
}

export default function Login() {
    const setUser = useAuthStore((s) => s.setUser)
    const [submitError, setSubmitError] = useState<string | null>(null)

    const methods = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    const navigate = useNavigate()
    const isSubmitting = methods.formState.isSubmitting
    const canSubmit = useMemo(() => !isSubmitting, [isSubmitting])
    
    const onSubmit = async (data: LoginFormValues) => {
        setSubmitError(null)
        try {
            const user = await findUserByEmail(data.email)
            if (!user) {
                setSubmitError("No account found for that email.")
                return
            }
            setUser(user)
            navigate({ to: "/ticketing_system" })
        } catch (e) {
            console.error("Login error:", e)
            setSubmitError("Could not log you in. Please try again.")
        }
    }

    return (
        <div className="flex min-h-[calc(100vh-57px)] w-full items-center justify-center bg-gray-50 p-6">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Welcome back</CardTitle>
                    <CardDescription>
                        Log in to continue to your projects and tickets.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <FormProvider {...methods}>
                        <form onSubmit={methods.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
                            <LoginFields />
                            {submitError ? (
                                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {submitError}
                                </div>
                            ) : null}
                            <Button id = "login-button" aria-label="Login" size="lg" variant="primary" type="submit" disabled={!canSubmit}>
                                {isSubmitting ? "Logging in..." : "Login"}
                            </Button>
                        </form>
                    </FormProvider>
                </CardContent>
                <CardFooter className="justify-between">
                    <span className="text-sm text-gray-600">
                        New here?{" "}
                        <Link
                            to="/signup"
                            className="font-medium text-blue-600 underline-offset-4 hover:underline"
                        >
                            Create an account
                        </Link>
                    </span>
                </CardFooter>
            </Card>
        </div>
    )
}