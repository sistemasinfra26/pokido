"use server"

import { prisma } from "@/lib/prisma"
import { WristbandStatus, TicketStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"

export async function getActiveParkChildren() {
    try {
        const now = new Date()

        const wristbandsInPark = await prisma.wristband.findMany({
            where: {
                status: WristbandStatus.IN_PARK,
            },
            include: {
                ticket: {
                    include: {
                        minor: true,
                        customer: true,
                        ticketType: true,
                    },
                },
            },
            orderBy: {
                assignedAt: "desc",
            },
        })

        let inParkCount = 0
        let waitingCount = 0

        const childrenList = wristbandsInPark.map((wb) => {
            const ticket = wb.ticket
            const minor = ticket?.minor
            const customer = ticket?.customer
            const ticketType = ticket?.ticketType

            const purchaseTimeFormatted = wb.assignedAt
                ? new Date(wb.assignedAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false })
                : "N/A"

            const slotStartTimeFormatted = ticket?.startTime
                ? new Date(ticket.startTime).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false })
                : "10:00"

            const slotEndTimeFormatted = ticket?.endTime
                ? new Date(ticket.endTime).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false })
                : "11:00"

            const startTime = ticket?.startTime ? new Date(ticket.startTime) : now
            const endTime = ticket?.endTime ? new Date(ticket.endTime) : now

            // Evaluación de estado
            if (now < startTime) {
                waitingCount++
            } else {
                inParkCount++
            }

            return {
                id: wb.id,
                wristbandCode: wb.code,
                ticketId: ticket?.id || "",
                minorName: minor?.fullName || "Menor no registrado",
                age: minor?.birthDate ? new Date().getFullYear() - new Date(minor.birthDate).getFullYear() : 0,
                medicalNotes: minor?.medicalNotes || undefined,
                tutorName: customer?.fullName || "Tutor no registrado",
                tutorPhone: customer?.phone || "Sin teléfono",
                purchaseTime: purchaseTimeFormatted,
                slotStartTime: slotStartTimeFormatted,
                slotEndTime: slotEndTimeFormatted,
                slotWindow: `${slotStartTimeFormatted} - ${slotEndTimeFormatted} hs`,
                contractedTime: ticketType ? `${ticketType.durationMinutes} min` : "60 min",
                durationMinutes: ticketType?.durationMinutes || 60,
                rawStartTime: startTime.toISOString(),
                rawEndTime: endTime.toISOString(),
            }
        })

        return {
            success: true,
            data: childrenList,
            counts: {
                activeInPark: inParkCount, // Solo los que están en su turno actual
                waiting: waitingCount,     // Compraron pero su turno aún no inicia
                totalRegistered: childrenList.length
            }
        }
    } catch (error: any) {
        console.error("Error cargando accesos:", error)
        return { success: false, error: error.message }
    }
}

export async function processChildCheckout(wristbandId: string, ticketId: string) {
    try {
        const now = new Date()

        await prisma.$transaction([
            // 1. Liberar la pulsera física
            prisma.wristband.update({
                where: { id: wristbandId },
                data: {
                    status: WristbandStatus.AVAILABLE,
                    returnedAt: now,
                },
            }),
            // 2. Marcar ticket como usado/completado
            prisma.ticket.update({
                where: { id: ticketId },
                data: {
                    status: TicketStatus.USED,
                },
            }),
        ])

        revalidatePath("/dashboard/access")
        revalidatePath("/dashboard")

        return { success: true }
    } catch (error: any) {
        console.error("Error en Check-out:", error)
        return { success: false, error: error.message || "Error al procesar salida." }
    }
}