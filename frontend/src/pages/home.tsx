import { Link } from '@tanstack/react-router'

export default function Home() {
    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold">Ticket Management</h1>
            <p className="text-gray-600">
                Welcome. Go to the login page to continue.
            </p>
            <Link
                to="/login"
                className="text-blue-600 underline w-fit hover:text-blue-800"
            >
                Login
            </Link>
        </div>
    )
}
