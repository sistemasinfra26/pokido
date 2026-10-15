"use server"

import { prisma } from "@/lib/prisma"
import { OrderStatus, BookingStatus } from "@prisma/client"

export interface ReportFilterInput {
    startDate: Date
    endDate: Date
}

export async function getFinancialReports(filter: ReportFilterInput) {
    try {
        const { startDate, endDate } = filter

        // 1. Total Ingresos Brutos y Cantidad de Órdenes (POS + WEB)
        const orderStats = await prisma.order.aggregate({
            where: {
                status: OrderStatus.COMPLETED,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            _sum: {
                total: true,
                subtotal: true,
                discount: true,
                tax: true,
            },
            _count: {
                id: true,
            },
        })

        const grossRevenue = Number(orderStats._sum.total || 0)
        const subtotal = Number(orderStats._sum.subtotal || 0)
        const discounts = Number(orderStats._sum.discount || 0)
        const totalOrders = orderStats._count.id || 0

        // Ingreso Neto (Subtotal menos Descuentos)
        const netRevenue = grossRevenue - discounts

        // Ticket Promedio
        const averageTicket = totalOrders > 0 ? grossRevenue / totalOrders : 0

        // 2. Ingresos desglosados por Canal (POS vs WEB)
        const revenueByChannel = await prisma.order.groupBy({
            by: ["channel"],
            where: {
                status: OrderStatus.COMPLETED,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            _sum: {
                total: true,
            },
        })

        return {
            success: true,
            data: {
                grossRevenue,
                netRevenue,
                discounts,
                totalOrders,
                averageTicket,
                revenueByChannel: revenueByChannel.map((item) => ({
                    channel: item.channel,
                    total: Number(item._sum.total || 0),
                })),
            },
        }
    } catch (error: any) {
        console.error("Error al obtener reportes financieros:", error)
        return { success: false, error: error.message }
    }
}

export async function getOperationalReports(filter: ReportFilterInput) {
    try {
        const { startDate, endDate } = filter

        // 1. Total de Niños / Pases Vendidos y Utilizados en el periodo
        const totalTicketsSold = await prisma.ticket.count({
            where: {
                validDate: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        })

        // 2. Total de Niños en Cumpleaños para el periodo
        const partyGuests = await prisma.booking.aggregate({
            where: {
                status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            _sum: {
                guestCount: true,
            },
            _count: {
                id: true,
            },
        })

        const totalPartyChildren = partyGuests._sum.guestCount || 0
        const totalParties = partyGuests._count.id || 0

        return {
            success: true,
            data: {
                totalTicketsSold,
                totalPartyChildren,
                totalParties,
                totalChildrenInPark: totalTicketsSold + totalPartyChildren,
            },
        }
    } catch (error: any) {
        console.error("Error al obtener reportes operativos:", error)
        return { success: false, error: error.message }
    }
}

export async function getPeakHoursReport(filter: ReportFilterInput) {
    try {
        const { startDate, endDate } = filter

        // Obtener todos los tickets activos o usados en el rango seleccionado
        const tickets = await prisma.ticket.findMany({
            where: {
                validDate: {
                    gte: startDate,
                    lte: endDate,
                },
                status: { in: ["ACTIVE", "IN_USE", "USED"] },
            },
            select: {
                startTime: true,
                validDate: true,
            },
        })

        // Mapeo de días de la semana y bloques horarios (10:00 - 21:00)
        const daysMap = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
        const hourBlocks = ["10:00", "12:00", "14:00", "16:00", "18:00", "20:00"]

        const hourlyDistribution = hourBlocks.map((hour) => {
            const row: Record<string, any> = { hora: hour }
            daysMap.forEach((day) => {
                row[day] = 0
            })
            return row
        })

        // Conteo y agrupación por hora y día
        tickets.forEach((t) => {
            if (t.validDate) {
                const dayName = daysMap[new Date(t.validDate).getDay()]
                const hour = t.startTime ? new Date(t.startTime).getHours() : 16

                // Encontrar el bloque correspondiente
                const blockIndex = Math.min(Math.floor((hour - 10) / 2), hourBlocks.length - 1)
                if (blockIndex >= 0 && hourlyDistribution[blockIndex]) {
                    hourlyDistribution[blockIndex][dayName] += 1
                }
            }
        })

        return {
            success: true,
            data: hourlyDistribution,
        }
    } catch (error: any) {
        console.error("Error al obtener reporte de horas pico:", error)
        return { success: false, error: error.message }
    }
}