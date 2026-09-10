"use server"

import { prisma } from "@/lib/prisma"

export async function saveWristbandAssignment(
    orderNumber: string,
    assignments: { ticketId: string; minorName: string; wristbandCode: string }[]
) {
    try {
        for (const item of assignments) {
            if (!item.wristbandCode) continue

            // Actualizamos el ticket asignando el código escaneado/autogenerado al campo qrCode
            await prisma.ticket.update({
                where: {
                    id: item.ticketId,
                },
                data: {
                    qrCode: item.wristbandCode.toUpperCase().trim(), // 👈 Nombre exacto según tu schema
                    status: "ACTIVE",
                },
            })
        }

        return { success: true }
    } catch (error: any) {
        console.error("Error al vincular pulsera:", error)
        return { success: false, error: error.message || "Error al vincular pulsera." }
    }
}