"use server"

import { clerkClient, currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

export type AppRole = "ADMIN" | "MANAGER" | "CASHIER" | "STAFF"

export async function inviteStaffMember(email: string, role: AppRole) {
    try {
        const user = await currentUser()
        const currentRole = (user?.publicMetadata as any)?.role

        // Permitimos que ADMIN y MANAGER puedan invitar personal
        if (!["ADMIN", "SUPERADMIN", "admin"].includes(currentRole)) {
            return { success: false, error: "Solo administradores pueden invitar personal." }
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

        // 2. URL de redirección dinámica según .env
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        const redirectUrl = `${baseUrl.replace(/\/$/, "")}/dashboard`

        // 3. Crear invitación con el Enum exacto
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

export async function getStaffList() {
    try {
        const client = await clerkClient()
        const response = await client.users.getUserList({ limit: 100 })

        const staff = response.data
            .map((u) => {
                const rawRole = (u.publicMetadata as any)?.role || "CUSTOMER"
                let role: AppRole | "CUSTOMER" = "CUSTOMER"

                if (["ADMIN", "admin"].includes(rawRole)) role = "ADMIN"
                else if (["MANAGER", "manager"].includes(rawRole)) role = "MANAGER"
                else if (["CASHIER", "cajera"].includes(rawRole)) role = "CASHIER"
                else if (["STAFF", "operador"].includes(rawRole)) role = "STAFF"

                return {
                    id: u.id,
                    firstName: u.firstName,
                    lastName: u.lastName,
                    email: u.emailAddresses[0]?.emailAddress,
                    role,
                    imageUrl: u.imageUrl,
                    createdAt: u.createdAt,
                }
            })
            .filter((u) => u.role !== "CUSTOMER")

        return { success: true, staff }
    } catch (error: any) {
        return { success: false, staff: [] }
    }
}

// 🔑 CAMBIAR ROL DE UN USUARIO EXISTENTE
export async function updateStaffRole(userId: string, newRole: AppRole) {
    try {
        const user = await currentUser()
        const currentRole = (user?.publicMetadata as any)?.role

        if (!["ADMIN", "SUPERADMIN", "admin"].includes(currentRole)) {
            return { success: false, error: "No tienes permisos para modificar roles." }
        }

        const client = await clerkClient()
        await client.users.updateUserMetadata(userId, {
            publicMetadata: { role: newRole },
        })

        revalidatePath("/dashboard/users")
        return { success: true }
    } catch (error: any) {
        console.error("Error al actualizar rol:", error)
        return { success: false, error: "No se pudo actualizar el rol del usuario." }
    }
}

// 🔑 ELIMINAR/REVOCAR ACCESO A UN USUARIO
export async function deleteStaffMember(userId: string) {
    try {
        const user = await currentUser()
        const currentRole = (user?.publicMetadata as any)?.role

        if (!["ADMIN", "SUPERADMIN", "admin"].includes(currentRole)) {
            return { success: false, error: "No tienes permisos para eliminar empleados." }
        }

        if (user?.id === userId) {
            return { success: false, error: "No puedes eliminar tu propia cuenta de administrador." }
        }

        const client = await clerkClient()
        await client.users.deleteUser(userId)

        revalidatePath("/dashboard/users")
        return { success: true }
    } catch (error: any) {
        console.error("Error al eliminar usuario:", error)
        return { success: false, error: "No se pudo eliminar al usuario." }
    }
}