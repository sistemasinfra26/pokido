"server-only"

import { clerkClient, currentUser } from "@clerk/nextjs/server"

export async function ensureUserRoleSynced() {
    const user = await currentUser()
    if (!user) return null

    const currentRole = (user.publicMetadata as any)?.role

    // Si el usuario ya tiene un rol asignado diferente a customer, lo dejamos pasar
    if (currentRole && currentRole !== "customer") {
        return currentRole
    }

    // Si no tiene rol, buscamos si este correo tenía una invitación con rol
    const client = await clerkClient()
    const email = user.emailAddresses[0]?.emailAddress

    if (!email) return "customer"

    const invitations = await client.invitations.getInvitationList({ status: "accepted" })
    const userInvitation = invitations.data.find(
        (inv) => inv.emailAddress.toLowerCase() === email.toLowerCase()
    )

    const invitedRole = (userInvitation?.publicMetadata as any)?.role

    if (invitedRole) {
        // Le asignamos el rol de la invitación al usuario real
        await client.users.updateUserMetadata(user.id, {
            publicMetadata: {
                ...user.publicMetadata,
                role: invitedRole,
            },
        })
        return invitedRole
    }

    return "customer"
}