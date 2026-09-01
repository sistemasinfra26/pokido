"use server"

import { prisma } from "@/lib/prisma"
import { TicketStatus, WristbandStatus } from "@prisma/client"
import { PARK_TOTAL_MAX_CAPACITY } from "@/lib/capacityLogic"

export async function getDashboardData() {
    try {
        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

        // 1. AFORO EN PARQUE (Pulseras o Tickets activos actualmente)
        const aforoActual = await prisma.wristband.count({
            where: { status: WristbandStatus.IN_PARK },
        })

        // Capacidad Máxima Global (Aforo del parque: 90)
        const aforoMax = PARK_TOTAL_MAX_CAPACITY

        // 2. VENTAS DEL DÍA
        const ordersToday = await prisma.order.findMany({
            where: {
                createdAt: { gte: startOfDay, lte: endOfDay },
                status: "COMPLETED",
            },
            select: { total: true },
        })

        const totalVentas = ordersToday.reduce((acc, curr) => acc + Number(curr.total), 0)
        const pedidosTotal = ordersToday.length

        // 3. CUMPLEAÑOS DEL DÍA Y RESERVAS
        const bookingsToday = await prisma.booking.findMany({
            where: {
                date: { gte: startOfDay, lte: endOfDay },
                status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
            },
            select: {
                startTime: true,
                guestCount: true,
            },
        })

        const cumpleanosHoyCount = bookingsToday.length

        // 4. TICKETS VENDIDOS HOY (Para llenar las barritas de turnos desde la compra)
        const ticketsToday = await prisma.ticket.findMany({
            where: {
                validDate: { gte: startOfDay, lte: endOfDay },
                status: { in: [TicketStatus.ACTIVE, TicketStatus.IN_USE] },
            },
            select: {
                startTime: true,
            },
        })

        // 5. CONSTRUCCIÓN DEL MAPA DE OCUPACIÓN POR TURNO (occupancyData)
        const occupancyData: Record<string, number> = {}

        // Sumar pases individuales vendidos por hora
        ticketsToday.forEach((ticket) => {
            if (ticket.startTime) {
                const dateObj = new Date(ticket.startTime)
                const hours = String(dateObj.getHours()).padStart(2, "0")
                const minutes = String(dateObj.getMinutes()).padStart(2, "0")
                const timeKey = `${hours}:${minutes}` // Ej: "17:00"

                occupancyData[timeKey] = (occupancyData[timeKey] || 0) + 1
            }
        })

        // Sumar cupos retenidos por salones de cumpleaños por hora
        bookingsToday.forEach((booking) => {
            if (booking.startTime) {
                const timeKey = booking.startTime.slice(0, 5) // Ej: "17:00"
                occupancyData[timeKey] = (occupancyData[timeKey] || 0) + booking.guestCount
            }
        })

        // 6. NIÑOS EXCEDIDOS EN TIEMPO
        const ticketsExcedidos = await prisma.ticket.count({
            where: {
                status: TicketStatus.ACTIVE,
                endTime: { lt: now },
            },
        })

        // 7. ALERTAS EN VIVO (Stock Bajo + Tiempos Excedidos)
        const alertItems = []

        if (ticketsExcedidos > 0) {
            alertItems.push({
                type: "TIME",
                title: `${ticketsExcedidos} Niños con tiempo excedido`,
                detail: "Requieren aviso o cobro de recargo",
                color: "text-pokido-red bg-pokido-red/10 border-pokido-red/20",
            })
        }

        const lowStockProducts = await prisma.product.findMany({
            where: {
                trackStock: true,
                stock: { lte: prisma.product.fields.minStock },
                isActive: true,
            },
            take: 2,
        })

        for (const prod of lowStockProducts) {
            alertItems.push({
                type: "STOCK",
                title: `Stock bajo: ${prod.name}`,
                detail: `Quedan ${prod.stock} unidades`,
                color: "text-pokido-orange bg-pokido-orange/10 border-pokido-orange/20",
            })
        }

        // 8. ESTADO DE SALONES DE CUMPLEAÑOS
        const rooms = await prisma.partyRoom.findMany({
            where: { isActive: true },
            include: {
                bookings: {
                    where: {
                        date: { gte: startOfDay, lte: endOfDay },
                    },
                },
            },
        })

        const partyRooms = rooms.map((room) => {
            const currentBooking = room.bookings[0]

            if (!currentBooking) {
                return {
                    name: room.name,
                    child: "Disponible",
                    slot: "Sin reservas",
                    status: "LIBRE",
                    badgeColor: "bg-slate-100 text-slate-500 border border-slate-200",
                }
            }

            return {
                name: room.name,
                child: `${currentBooking.birthdayChild || "Cumpleañero"} (${currentBooking.childAge || "?"} años)`,
                slot: `${currentBooking.startTime} - ${currentBooking.endTime}`,
                status: currentBooking.status === "IN_PROGRESS" ? "EN CURSO" : "PRÓXIMO",
                badgeColor:
                    currentBooking.status === "IN_PROGRESS"
                        ? "bg-pokido-green/15 text-pokido-green border border-pokido-green/20"
                        : "bg-pokido-orange/15 text-pokido-orange border border-pokido-orange/20",
            }
        })

        return {
            success: true,
            data: {
                kpis: {
                    aforoActual,
                    aforoMax,
                    ventasHoy: `$ ${totalVentas.toLocaleString("es-CL")}`,
                    pedidosTotal,
                    cumpleanosHoy: cumpleanosHoyCount,
                    alertasTiempo: ticketsExcedidos,
                },
                alertItems,
                partyRooms,
                occupancyData, // Se retorna el mapeo directo para llenar las barritas de pases
            },
        }
    } catch (error: any) {
        console.error("Error obteniendo datos del dashboard:", error)
        return { success: false, error: error.message }
    }
}