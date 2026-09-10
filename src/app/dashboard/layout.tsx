import { currentUser, clerkClient } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Sidebar } from "./components/Sidebar"

export default async function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const user = await currentUser()

    if (!user) {
        redirect("/")
    }

    let userRole = (user.publicMetadata as any)?.role

    // Si aún no se le asignó el rol, revisamos si viene de una invitación
    if (!userRole || userRole === "customer") {
        const client = await clerkClient()
        const email = user.primaryEmailAddress?.emailAddress

        if (email) {
            // Consultar si hay invitaciones aceptadas o pendientes para este email
            const response = await client.invitations.getInvitationList()
            const match = response.data.find(
                (inv) => inv.emailAddress.toLowerCase() === email.toLowerCase()
            )

            const invitedRole = (match?.publicMetadata as any)?.role

            if (invitedRole) {
                // Actualizamos los metadatos del usuario en Clerk
                await client.users.updateUserMetadata(user.id, {
                    publicMetadata: {
                        ...user.publicMetadata,
                        role: invitedRole,
                    },
                })
                userRole = invitedRole
            }
        }
    }

    // Si después de verificar sigue siendo cliente común, lo enviamos a /reserva
    if (userRole === "customer") {
        redirect("/reserva")
    }

    return (
        <div className="flex min-h-screen bg-slate-950 font-sans">
            <Sidebar />
            <main className="flex-1 overflow-x-hidden pt-16 lg:pt-0">
                {children}
            </main>
        </div>
    )
}