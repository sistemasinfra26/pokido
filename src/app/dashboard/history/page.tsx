import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import HistoryClientView from "./HistoryClientView"

export default async function HistoryPage() {
    const user = await currentUser()
    const role = (user?.publicMetadata as any)?.role

    // Solo administradores pueden ver el historial general y auditorías
    if (role !== "admin") {
        redirect("/dashboard")
    }

    return <HistoryClientView />
}