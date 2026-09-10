import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import UsersClientView from "./UsersClientView"

export default async function UsersPage() {
    const user = await currentUser()
    const role = (user?.publicMetadata as any)?.role

    // Protegemos la ruta directamente en el servidor
    if (role !== "admin") {
        redirect("/dashboard")
    }

    return <UsersClientView />
}