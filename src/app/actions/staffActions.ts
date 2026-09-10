"use server"

import { clerkClient, currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

export async function inviteStaffMember(email: string, role: "admin" | "cajera" | "operador") {
    try {
        const user = await currentUser()
        const currentRole = (user?.publicMetadata as any)?.role

        if (currentRole !== "admin") {
            return { success: false, error: "Solo los administradores pueden invitar personal." }
        }

        const client = await clerkClient()
        const normalizedEmail = email.trim().toLowerCase()

        // 1. Limpiar invitaciones pendientes previas
        try {
            const existingInvitations = await client.invitations.getInvitationList()
            const pendingInvites = existingInvitations.data.filter(
                (inv) => inv.emailAddress.toLowerCase() === normalizedEmail && inv.status === "pending"
            )

            for (const inv of pendingInvites) {
                await client.invitations.revokeInvitation(inv.id)
            }
        } catch (cleanError) {
            console.warn("Error al limpiar invitaciones previas:", cleanError)
        }

        // 2. Usar NEXT_PUBLIC_BASE_URL de tu .env
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        const redirectUrl = `${baseUrl.replace(/\/$/, "")}/dashboard`

        // 3. Crear la invitación en Clerk
        const invitation = await client.invitations.createInvitation({
            emailAddress: normalizedEmail,
            publicMetadata: { role },
            redirectUrl,
            ignoreExisting: true,
        })

        revalidatePath("/dashboard/users")

        return {
            success: true,
            invitation: {
                id: invitation.id,
                emailAddress: invitation.emailAddress,
                status: invitation.status,
            }
        }
    } catch (error: any) {
        console.error("Error al invitar desde Clerk:", error)
        const clerkMessage = error?.errors?.[0]?.longMessage || error?.errors?.[0]?.message || error?.message
        return { success: false, error: clerkMessage || "Ocurrió un error al enviar la invitación." }
    }
}

// 2. Obtener la lista de usuarios con rol de personal
export async function getStaffList() {
    try {
        const client = await clerkClient()
        const response = await client.users.getUserList({ limit: 100 })

        const staff = response.data
            .map((u) => ({
                id: u.id,
                firstName: u.firstName,
                lastName: u.lastName,
                email: u.emailAddresses[0]?.emailAddress,
                role: (u.publicMetadata as any)?.role || "customer",
                imageUrl: u.imageUrl,
                createdAt: u.createdAt,
            }))
            .filter((u) => u.role !== "customer") // Filtrar solo el personal interno

        return { success: true, staff }
    } catch (error: any) {
        return { success: false, staff: [] }
    }
}