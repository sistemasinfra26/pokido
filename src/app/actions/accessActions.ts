"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { WristbandStatus, TicketStatus, OrderStatus } from "@prisma/client" // 'OrderStatus' agregado aquí

export async function getActiveParkChildren() {
    try {
        const now = new Date()

        const activeTickets = await prisma.ticket.findMany({
            where: {
                status: TicketStatus.ACTIVE,
                // Filtramos para mostrar únicamente las órdenes confirmadas/pagadas
                order: {
                    status: OrderStatus.COMPLETED,
                },
            },
            include: {
                minor: true,
                customer: true,
                ticketType: true,
                order: {
                    select: {
                        channel: true,
                        status: true,
                        payments: {
                            select: {
                                method: true,
                            },
                        },
                    },
                },
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

            const orderChannel = ticket.order?.channel || "POS"
            const orderStatus = ticket.order?.status || "COMPLETED"
            const paymentMethod = ticket.order?.payments?.[0]?.method || (orderChannel === "WEB" ? "MERCADOPAGO" : "EFECTIVO")

            return {
                id: minor?.id || ticket.id,
                wristbandCode: code,
                ticketId: ticket.id,
                customerId: customer?.id || "",
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

                channel: orderChannel === "WEB" ? "WEB" : "POS",
                orderStatus: orderStatus,
                paymentMethod: paymentMethod,
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

export async function findOrderByQrOrCode(searchQuery: string) {
    try {
        const cleanQuery = searchQuery.trim().toUpperCase()

        const order = await prisma.order.findFirst({
            where: {
                OR: [
                    { orderNumber: cleanQuery },
                    { tickets: { some: { qrCode: cleanQuery } } },
                ],
            },
            include: {
                customer: true,
                tickets: {
                    include: {
                        minor: true,
                        ticketType: true,
                        wristband: true,
                    },
                },
            },
        })

        if (!order) {
            return { success: false, error: "No se encontró ninguna reserva o ticket con ese código." }
        }

        return { success: true, order }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function assignWristbandToTicket(ticketId: string, wristbandCode: string, color: string) {
    try {
        if (!wristbandCode.trim()) {
            return { success: false, error: "Debes ingresar o escanear el código de la pulsera física." }
        }

        const cleanCode = wristbandCode.trim().toUpperCase()

        // 1. Verificar o crear la pulsera
        let wristband = await prisma.wristband.findUnique({
            where: { code: cleanCode },
        })

        if (!wristband) {
            wristband = await prisma.wristband.create({
                data: {
                    code: cleanCode,
                    color: color || "AZUL",
                    status: WristbandStatus.ASSIGNED,
                    ticketId,
                    assignedAt: new Date(),
                },
            })
        } else {
            await prisma.wristband.update({
                where: { id: wristband.id },
                data: {
                    ticketId,
                    status: WristbandStatus.ASSIGNED,
                    assignedAt: new Date(),
                },
            })
        }

        // 2. Activar ticket e iniciar tiempo en pista
        await prisma.ticket.update({
            where: { id: ticketId },
            data: {
                status: TicketStatus.IN_USE,
                startTime: new Date(),
            },
        })

        revalidatePath("/dashboard/access")
        return { success: true }
    } catch (error: any) {
        return { success: false, error: "Error al asignar la pulsera." }
    }
}