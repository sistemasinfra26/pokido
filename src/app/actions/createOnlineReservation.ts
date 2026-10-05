"use server"

import { prisma } from "@/lib/prisma"
import { SalesChannel, OrderStatus, TicketStatus } from "@prisma/client"
import { createMercadoPagoPreference } from "./checkoutActions"

interface ReserveInput {
    date: string // "YYYY-MM-DD"
    ticketTypeId: string
    tutor: {
        fullName: string
        dni: string
        email: string
        phone: string
    }
    minors: { fullName: string; birthDate?: string }[]
}

export async function createOnlineReservation(input: ReserveInput) {
    try {
        const { date, ticketTypeId, tutor, minors } = input

        // 1. Obtener precio del pase elegido
        const ticketType = await prisma.ticketType.findUnique({
            where: { id: ticketTypeId },
        })

        if (!ticketType || !ticketType.isActive) {
            return { success: false, error: "El pase seleccionado no está disponible." }
        }

        const pricePerTicket = Number(ticketType.price)
        const totalAmount = pricePerTicket * minors.length

        // 2. Crear o actualizar Tutor (Customer)
        const customer = await prisma.customer.upsert({
            where: { dni: tutor.dni },
            update: { fullName: tutor.fullName, email: tutor.email, phone: tutor.phone },
            create: {
                dni: tutor.dni,
                fullName: tutor.fullName,
                email: tutor.email,
                phone: tutor.phone,
            },
        })

        // 3. Crear registros de Menores
        const minorRecords = await Promise.all(
            minors.map((m) =>
                prisma.minor.create({
                    data: {
                        customerId: customer.id,
                        fullName: m.fullName,
                        birthDate: m.birthDate ? new Date(m.birthDate) : new Date("2018-01-01"),
                    },
                })
            )
        )

        // 4. Generar Correlativo Único para la Reserva Web (Ej: WEB-2026-0001)
        const count = await prisma.order.count()
        const orderNumber = `WEB-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`

        // 5. Crear la Orden en estado PENDING con sus Tickets
        const order = await prisma.order.create({
            data: {
                orderNumber,
                channel: SalesChannel.WEB,
                customerId: customer.id,
                subtotal: totalAmount,
                total: totalAmount,
                status: OrderStatus.PENDING, // 🔑 En PENDING no impacta el aforo activo hasta ser pagada
                tickets: {
                    create: minorRecords.map((minor) => ({
                        ticketTypeId: ticketType.id,
                        customerId: customer.id,
                        minorId: minor.id,
                        qrCode: `QR-${orderNumber}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
                        price: pricePerTicket,
                        validDate: new Date(date),
                        status: TicketStatus.ACTIVE, // Se activará del todo cuando la orden pase a COMPLETED en el webhook
                    })),
                },
            },
        })

        // 6. 🔑 REUTILIZACIÓN: Llamamos directamente a tu función `createMercadoPagoPreference`
        const mpResult = await createMercadoPagoPreference(order.id)

        if (!mpResult.success) {
            return { success: false, error: mpResult.error }
        }

        return {
            success: true,
            initPoint: mpResult.initPoint,
            orderNumber: order.orderNumber,
        }
    } catch (error: any) {
        console.error("Error al generar reserva online:", error)
        return { success: false, error: error.message || "Error al procesar la reserva." }
    }
}