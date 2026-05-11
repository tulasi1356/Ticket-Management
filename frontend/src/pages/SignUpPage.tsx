import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import {
    FormProvider,
    useForm,
    useFormContext,
} from 'react-hook-form'
import { z } from 'zod'
import { useCreateUser } from '../hooks/users/useCreateUser'
import { Button } from '../components/ui/button'
import { FormInput } from '../components/form/formInput'
import { useAuthStore } from '../stores/authStore'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "../components/ui/card"

const signUpSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z
        .email('Enter a valid email')
        .min(1, 'Email is required'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters'),
})

type SignUpFormValues = z.infer<typeof signUpSchema>

function SignUpFields() {
    const { control } = useFormContext<SignUpFormValues>()

    return (
        <>
            <FormInput
                name="name"
                control={control}
                label="Name"
                placeholder="Enter your name"
                size="lg"
            />
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

export default function SignUp() {
    const { mutateAsync: createUser } = useCreateUser()
    const setUser = useAuthStore((s) => s.setUser)
    const navigate = useNavigate()
    const [submitError, setSubmitError] = useState<string | null>(null)

    const methods = useForm<SignUpFormValues>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
        },
    })

    const onSubmit = async (data: SignUpFormValues) => {
        setSubmitError(null)
        try {
            const newUser = await createUser({
                name: data.name,
                email: data.email,
                password: data.password,
            })
            setUser(newUser)
            navigate({ to: "/ticketing_system" })
        } catch (error) {
            console.error("Error signing up:", error)
            setSubmitError("Could not create your account. Please try again.")
        }
    }

    return (
        <div className="flex min-h-[calc(100vh-57px)] w-full items-center justify-center bg-gray-50 p-6">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Create your account</CardTitle>
                    <CardDescription>
                        Set up your profile to start managing projects and tickets.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <FormProvider {...methods}>
                        <form
                            onSubmit={methods.handleSubmit(onSubmit)}
                            className="flex flex-col gap-4"
                            noValidate
                        >
                            <SignUpFields />
                            {submitError ? (
                                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {submitError}
                                </div>
                            ) : null}
                            <SignUpButton />
                        </form>
                    </FormProvider>
                </CardContent>
                <CardFooter className="justify-between">
                    <span className="text-sm text-gray-600">
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            className="font-medium text-blue-600 underline-offset-4 hover:underline"
                        >
                            Login
                        </Link>
                    </span>
                </CardFooter>
            </Card>
        </div>
    )
}

function SignUpButton() {
    const { formState } = useFormContext<SignUpFormValues>()
    const isSubmitting = formState.isSubmitting
    const canSubmit = useMemo(() => !isSubmitting, [isSubmitting])

    return (
        <Button id = "sign-up-button" aria-label="Sign up" size="lg" variant="primary" type="submit" disabled={!canSubmit}>
            {isSubmitting ? "Creating account..." : "Sign Up"}
        </Button>
    )
}
