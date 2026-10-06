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