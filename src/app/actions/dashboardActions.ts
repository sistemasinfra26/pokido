"use server"

import { prisma } from "@/lib/prisma"
import { TicketStatus } from "@prisma/client"
import { PARK_TOTAL_MAX_CAPACITY } from "@/lib/capacityLogic"

export async function getDashboardData() {
    try {
        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

        // 1. OBTENER TICKETS ACTIVOS DEL DÍA
        const activeTickets = await prisma.ticket.findMany({
            where: {
                validDate: { gte: startOfDay, lte: endOfDay },
                status: { in: [TicketStatus.ACTIVE, TicketStatus.IN_USE] },
            },
            include: {
                minor: true,
                customer: true,
                ticketType: true,
                wristband: true,
            },
            orderBy: { startTime: "asc" },
        })

        let aforoActual = 0
        let enEspera = 0

        // Mapeo detallado y discriminación de estado por horario
        const activeChildren = activeTickets.map((t) => {
            const start = t.startTime ? new Date(t.startTime) : now
            const end = t.endTime ? new Date(t.endTime) : new Date(start.getTime() + (t.ticketType?.durationMinutes || 60) * 60000)

            const isPlaying = start <= now && now <= end
            const isWaiting = start > now
            const isExpired = now > end

            // 🔑 CONTADORES DE AFORO REAL
            if (isPlaying || isExpired) {
                aforoActual++ // Está jugando o está excedido -> Físicamente en pista
            } else if (isWaiting) {
                enEspera++ // Su turno es más tarde -> En Espera (NO descuenta aforo de pista actual)
            }

            return {
                id: t.id,
                wristbandCode: t.wristband?.code || t.qrCode || "S/A",
                ticketId: t.id,
                minorName: t.minor?.fullName || "Niño sin nombre",
                age: 0,
                tutorName: t.customer?.fullName || "Tutor Registrado",
                tutorPhone: t.customer?.phone || "Sin teléfono",
                purchaseTime: t.createdAt.toISOString(),
                slotStartTime: `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`,
                slotEndTime: `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`,
                slotWindow: `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")} - ${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`,
                contractedTime: `${t.ticketType?.durationMinutes || 60} min`,
                durationMinutes: t.ticketType?.durationMinutes || 60,
                rawStartTime: start.toISOString(),
                rawEndTime: end.toISOString(),
                status: isPlaying ? "PLAYING" : isWaiting ? "WAITING" : "EXPIRED",
            }
        })

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

        // 3. CUMPLEAÑOS Y RESERVAS DEL DÍA
        const bookingsToday = await prisma.booking.findMany({
            where: {
                date: { gte: startOfDay, lte: endOfDay },
                status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
            },
            select: {
                startTime: true,
                endTime: true,
                guestCount: true,
            },
        })

        const cumpleanosHoyCount = bookingsToday.length

        // 4. MAPA UNIFICADO DE OCUPACIÓN POR TURNO (occupancyData)
        const occupancyData: Record<string, number> = {}

        activeTickets.forEach((ticket) => {
            if (ticket.startTime) {
                const start = new Date(ticket.startTime)
                const hours = String(start.getHours()).padStart(2, "0")
                const minutes = String(start.getMinutes()).padStart(2, "0")
                const startKey = `${hours}:${minutes}`

                occupancyData[startKey] = (occupancyData[startKey] || 0) + 1

                const duration = ticket.ticketType?.durationMinutes || 60
                if (duration >= 60) {
                    const nextSlotDate = new Date(start.getTime() + 30 * 60000)
                    const nextHours = String(nextSlotDate.getHours()).padStart(2, "0")
                    const nextMinutes = String(nextSlotDate.getMinutes()).padStart(2, "0")
                    const nextKey = `${nextHours}:${nextMinutes}`

                    occupancyData[nextKey] = (occupancyData[nextKey] || 0) + 1
                }
            }
        })

        bookingsToday.forEach((booking) => {
            if (booking.startTime && booking.endTime) {
                const [startH, startM] = booking.startTime.split(":").map(Number)
                const [endH, endM] = booking.endTime.split(":").map(Number)

                let currentMinutes = startH * 60 + startM
                const endMinutes = endH * 60 + endM

                while (currentMinutes < endMinutes) {
                    const h = String(Math.floor(currentMinutes / 60)).padStart(2, "0")
                    const m = String(currentMinutes % 60).padStart(2, "0")
                    const timeKey = `${h}:${m}`

                    occupancyData[timeKey] = (occupancyData[timeKey] || 0) + booking.guestCount
                    currentMinutes += 30
                }
            }
        })

        // 5. NIÑOS EXCEDIDOS EN TIEMPO
        const ticketsExcedidos = activeTickets.filter((t) => {
            if (!t.endTime) return false
            return new Date(t.endTime) < now
        }).length

        // 6. ALERTAS EN VIVO
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

        // 7. ESTADO DE SALONES DE CUMPLEAÑOS
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
                    aforoActual, // 👈 Ahora sólo suma los que están en pista o excedidos
                    enEspera,    // 👈 Niños con pases comprados para turnos más tarde
                    aforoMax,
                    ventasHoy: `$ ${totalVentas.toLocaleString("es-CL")}`,
                    pedidosTotal,
                    cumpleanosHoy: cumpleanosHoyCount,
                    alertasTiempo: ticketsExcedidos,
                },
                activeChildren,
                alertItems,
                partyRooms,
                occupancyData,
            },
        }
    } catch (error: any) {
        console.error("Error obteniendo datos del dashboard:", error)
        return { success: false, error: error.message }
    }
}