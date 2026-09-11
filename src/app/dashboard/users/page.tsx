import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import UsersClientView from "./UsersClientView"

export default async function UsersPage() {
    const user = await currentUser()
    const role = (user?.publicMetadata as any)?.role

    // Permitimos acceso a administradores
    const isAdmin = ["ADMIN", "SUPERADMIN", "admin"].includes(role)

    if (!isAdmin) {
        redirect("/dashboard")
    }

    return <UsersClientView />
}