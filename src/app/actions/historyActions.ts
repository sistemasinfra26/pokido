"use server"

import { prisma } from "@/lib/prisma"

export async function getParkHistory() {
    try {
        const now = new Date()

        const tickets = await prisma.ticket.findMany({
            include: {
                minor: true,
                customer: true,
                ticketType: true,
                order: {
                    include: {
                        payments: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 100,
        })

        const historyData = tickets.map((ticket) => {
            const isOvertime = ticket.ticketType?.name.includes("OVERTIME") || ticket.qrCode.includes("-REC-")
            const payment = ticket.order?.payments[0]

            const rawMinorName = ticket.minor?.fullName || "Menor no registrado"
            const cleanMinorName = rawMinorName.replace(" (RECARGO EXCESO DE TIEMPO)", "").trim()

            const start = ticket.startTime ? new Date(ticket.startTime) : null
            const end = ticket.endTime ? new Date(ticket.endTime) : null

            // 🔑 DETERMINAR ESTADO REAL EN BASE AL TIEMPO ACTUAL
            let realStatus: "USED" | "PLAYING" | "WAITING" | "EXPIRED" = "WAITING"

            if (ticket.status === "USED") {
                realStatus = "USED"
            } else if (start && end) {
                if (now < start) {
                    realStatus = "WAITING" // Su turno es más tarde
                } else if (now >= start && now <= end) {
                    realStatus = "PLAYING" // Jugando en pista ahora
                } else {
                    realStatus = "EXPIRED" // Tiempo excedido en pista
                }
            }

            return {
                id: ticket.id,
                qrCode: ticket.qrCode,
                minorName: cleanMinorName,
                tutorName: ticket.customer?.fullName || "Tutor no registrado",
                tutorDni: ticket.customer?.dni || "S/D",
                ticketType: isOvertime ? "⚠️ Recargo Exceso de Tiempo" : ticket.ticketType?.name || "Pase Estándar",
                amount: Number(ticket.price || 0),
                paymentMethod: payment?.method || "CASH",
                status: ticket.status,
                realStatus, // 👈 Se envía el estado real calculado por tiempo
                startTime: start ? start.toISOString() : null,
                endTime: end ? end.toISOString() : null,
                createdAt: ticket.createdAt.toISOString(),
                isOvertime,
            }
        })

        return { success: true, data: historyData }
    } catch (error: any) {
        console.error("Error al obtener historial:", error)
        return { success: false, error: error.message }
    }
}