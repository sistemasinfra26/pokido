"use server"

import { prisma } from "@/lib/prisma"
import { TicketStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"

export async function getActiveParkChildren() {
    try {
        const now = new Date()

        const activeTickets = await prisma.ticket.findMany({
            where: {
                status: TicketStatus.ACTIVE,
            },
            include: {
                minor: true,
                customer: true,
                ticketType: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        let inParkCount = 0
        let waitingCount = 0

        const childrenList = activeTickets.map((ticket) => {
            const minor = ticket.minor
            const customer = ticket.customer
            const ticketType = ticket.ticketType

            const purchaseTimeFormatted = ticket.createdAt
                ? new Date(ticket.createdAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false })
                : "N/A"

            const slotStartTimeFormatted = ticket.startTime
                ? new Date(ticket.startTime).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false })
                : "10:00"

            const slotEndTimeFormatted = ticket.endTime
                ? new Date(ticket.endTime).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false })
                : "11:00"

            const startTime = ticket.startTime ? new Date(ticket.startTime) : now
            const endTime = ticket.endTime ? new Date(ticket.endTime) : now

            if (now < startTime) {
                waitingCount++
            } else {
                inParkCount++
            }

            const code = ticket.qrCode && ticket.qrCode.trim() !== "" ? ticket.qrCode.trim() : "SIN-PULSERA"

            return {
                id: minor?.id || ticket.id,
                wristbandCode: code,
                ticketId: ticket.id,
                customerId: customer?.id || "", // 👈 INCLUIDO: ID real del tutor para evitar error de FK en Order
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
                activeInPark: inParkCount,
                waiting: waitingCount,
                totalRegistered: childrenList.length,
            },
        }
    } catch (error: any) {
        console.error("Error cargando accesos:", error)
        return { success: false, error: error.message }
    }
}

export async function processChildCheckout(childId: string, ticketId: string) {
    try {
        await prisma.ticket.update({
            where: { id: ticketId },
            data: {
                status: TicketStatus.USED,
            },
        })

        revalidatePath("/dashboard/access")
        revalidatePath("/dashboard")

        return { success: true }
    } catch (error: any) {
        console.error("Error en Check-out:", error)
        return { success: false, error: error.message || "Error al procesar salida." }
    }
}