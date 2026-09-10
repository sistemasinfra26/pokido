"use server"

import { prisma } from "@/lib/prisma"
import { PARK_TOTAL_MAX_CAPACITY } from "@/lib/capacityLogic"

export interface SlotStatus {
    slot: string
    isPast: boolean
    available: number
    isFull: boolean
}

export interface OnlineBookingInput {
    customerDni: string
    customerName: string
    customerPhone: string
    customerEmail: string
    dateStr: string
    timeSlot: string
    signedWaiver: boolean
    minors: Array<{
        fullName: string
        age: number
        ticketTypeId: string
        price: number
    }>
}

const ALL_SLOTS = [
    "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30", "20:00"
]

// 1. Obtener cupos disponibles por turno para la web pública
export async function getPublicSlotAvailability(dateStr: string) {
    try {
        const now = new Date()
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
        const isToday = dateStr === todayStr

        const selectedDate = new Date(`${dateStr}T00:00:00`)
        const startOfDay = new Date(selectedDate)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(selectedDate)
        endOfDay.setHours(23, 59, 59, 999)

        // A. Consultar tickets vendidos para la fecha
        const tickets = await prisma.ticket.findMany({
            where: {
                validDate: { gte: startOfDay, lte: endOfDay },
                status: { in: ["ACTIVE", "IN_USE"] },
            },
            select: {
                startTime: true,
                ticketType: { select: { durationMinutes: true } },
            },
        })

        // B. Consultar reservas de cumpleaños para la fecha
        const bookings = await prisma.booking.findMany({
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

        const occupancyMap: Record<string, number> = {}

        // Mapeo pases individuales
        tickets.forEach((t) => {
            if (t.startTime) {
                const start = new Date(t.startTime)
                const h = String(start.getHours()).padStart(2, "0")
                const m = String(start.getMinutes()).padStart(2, "0")
                const slotKey = `${h}:${m}`

                occupancyMap[slotKey] = (occupancyMap[slotKey] || 0) + 1

                const duration = t.ticketType?.durationMinutes || 60
                if (duration >= 60) {
                    const nextDate = new Date(start.getTime() + 30 * 60000)
                    const nextKey = `${String(nextDate.getHours()).padStart(2, "0")}:${String(nextDate.getMinutes()).padStart(2, "0")}`
                    occupancyMap[nextKey] = (occupancyMap[nextKey] || 0) + 1
                }
            }
        })

        // Mapeo cumpleaños
        bookings.forEach((b) => {
            if (b.startTime && b.endTime) {
                const [startH, startM] = b.startTime.split(":").map(Number)
                const [endH, endM] = b.endTime.split(":").map(Number)

                let curMins = startH * 60 + startM
                const endMins = endH * 60 + endM

                while (curMins < endMins) {
                    const h = String(Math.floor(curMins / 60)).padStart(2, "0")
                    const m = String(curMins % 60).padStart(2, "0")
                    const slotKey = `${h}:${m}`

                    occupancyMap[slotKey] = (occupancyMap[slotKey] || 0) + b.guestCount
                    curMins += 30
                }
            }
        })

        // C. Filtro de expiración por hora actual
        const currentMins = now.getHours() * 60 + now.getMinutes()

        const slots: SlotStatus[] = ALL_SLOTS.map((slot) => {
            const [h, m] = slot.split(":").map(Number)
            const slotMins = h * 60 + m

            const isPast = isToday && slotMins <= currentMins
            const taken = occupancyMap[slot] || 0
            const available = Math.max(0, PARK_TOTAL_MAX_CAPACITY - taken)

            return {
                slot,
                isPast,
                available,
                isFull: available <= 0,
            }
        })

        return {
            success: true,
            slots,
            maxCapacity: PARK_TOTAL_MAX_CAPACITY,
        }
    } catch (error: any) {
        console.error("Error al obtener disponibilidad web:", error)
        return { success: false, error: error.message, slots: [], maxCapacity: PARK_TOTAL_MAX_CAPACITY }
    }
}

// 2. Procesar reserva e intento de pago online (🔑 EXPORTACIÓN EXPLÍCITA)
export async function createOnlineOrder(input: OnlineBookingInput) {
    try {
        const { customerDni, customerName, customerPhone, customerEmail, dateStr, timeSlot, signedWaiver, minors } = input

        if (!customerDni || !customerName || minors.length === 0) {
            return { success: false, error: "Información incompleta para procesar la compra." }
        }

        if (!signedWaiver) {
            return { success: false, error: "Es obligatorio firmar el deslinde de responsabilidad (Waiver)." }
        }

        // A. Crear o actualizar cliente (Tutor)
        const cleanDni = customerDni.replace(/[^0-9kK]/g, "").trim()

        let customer = await prisma.customer.findFirst({
            where: {
                OR: [{ dni: cleanDni }, { dni: customerDni.trim() }],
            },
        })

        if (!customer) {
            customer = await prisma.customer.create({
                data: {
                    dni: cleanDni || customerDni.trim(),
                    fullName: customerName.trim(),
                    phone: customerPhone.trim(),
                    email: customerEmail.trim(),
                },
            })
        }

        // B. Registrar Waiver firmado (vigente por 1 año)
        const expiresAt = new Date()
        expiresAt.setFullYear(expiresAt.getFullYear() + 1)

        await prisma.waiver.create({
            data: {
                customerId: customer.id,
                signedAt: new Date(),
                expiresAt,
                isValid: true,
            },
        })

        // C. Crear la Orden de Compra
        const totalAmount = minors.reduce((acc, m) => acc + m.price, 0)
        const orderNumber = `WEB-${Date.now().toString().slice(-6)}`

        const newOrder = await prisma.order.create({
            data: {
                orderNumber,
                customerId: customer.id,
                subtotal: totalAmount,
                total: totalAmount,
                status: "PENDING",
            },
        })

        // D. Crear los Menores y sus Tickets
        const [hours, minutes] = timeSlot.split(":").map(Number)
        const ticketDate = new Date(`${dateStr}T00:00:00`)

        const startTime = new Date(ticketDate)
        startTime.setHours(hours, minutes, 0, 0)

        for (const minorItem of minors) {
            let minor = await prisma.minor.findFirst({
                where: {
                    customerId: customer.id,
                    fullName: { equals: minorItem.fullName.trim(), mode: "insensitive" },
                },
            })

            if (!minor) {
                const birthDate = new Date()
                birthDate.setFullYear(birthDate.getFullYear() - (minorItem.age || 0))

                minor = await prisma.minor.create({
                    data: {
                        customerId: customer.id,
                        fullName: minorItem.fullName.trim(),
                        birthDate,
                    },
                })
            }

            const duration = minorItem.ticketTypeId.includes("120") ? 120 : minorItem.ticketTypeId.includes("90") ? 90 : 60
            const endTime = new Date(startTime.getTime() + duration * 60000)

            const qrCode = `QR-${orderNumber}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

            await prisma.ticket.create({
                data: {
                    orderId: newOrder.id,
                    customerId: customer.id,
                    minorId: minor.id,
                    ticketTypeId: minorItem.ticketTypeId,
                    price: minorItem.price,
                    validDate: ticketDate,
                    startTime,
                    endTime,
                    qrCode,
                    status: "ACTIVE",
                },
            })
        }

        return {
            success: true,
            orderId: newOrder.id,
            orderNumber: newOrder.orderNumber,
            total: totalAmount,
            customerName: customer.fullName,
        }
    } catch (error: any) {
        console.error("Error al registrar orden web:", error)
        return { success: false, error: error.message }
    }
}