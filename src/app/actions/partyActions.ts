"use server"

import { prisma } from "@/lib/prisma"
import { BookingStatus, SalesChannel, OrderStatus, WristbandStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { createMercadoPagoPreference } from "./checkoutActions"

export interface CreateOnlinePartyBookingInput {
    roomId: string
    customerDni: string
    customerName: string
    customerPhone: string
    customerEmail?: string
    birthdayChild: string
    childAge: number
    guestCount: number
    dateStr: string
    startTimeStr: string
    endTimeStr: string
    totalPrice: number
}

// 🔑 Helpers para convertir Decimal y Date a tipos primitivos JSON serializables
function sanitizeBooking(b: any) {
    if (!b) return null
    return {
        ...b,
        totalPrice: b.totalPrice ? Number(b.totalPrice) : 0,
        depositPaid: b.depositPaid ? Number(b.depositPaid) : 0,
        date: b.date instanceof Date ? b.date.toISOString() : b.date,
        createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : b.createdAt,
        updatedAt: b.updatedAt instanceof Date ? b.updatedAt.toISOString() : b.updatedAt,
    }
}

function sanitizeRoom(room: any) {
    if (!room) return null
    return {
        ...room,
        basePrice: room.basePrice ? Number(room.basePrice) : 0,
        extraGuestPrice: room.extraGuestPrice ? Number(room.extraGuestPrice) : 0,
        createdAt: room.createdAt instanceof Date ? room.createdAt.toISOString() : room.createdAt,
        updatedAt: room.updatedAt instanceof Date ? room.updatedAt.toISOString() : room.updatedAt,
    }
}

// 🔑 Crea reserva de cumpleaños y redirige a Mercado Pago
export async function createOnlinePartyBooking(data: CreateOnlinePartyBookingInput) {
    try {
        const [year, month, day] = data.dateStr.split("-").map(Number)
        const bookingDate = new Date(year, month - 1, day, 0, 0, 0)

        // 0. Validar si el salón ya está reservado para esa fecha y horario
        const existingBooking = await prisma.booking.findFirst({
            where: {
                roomId: data.roomId,
                date: bookingDate,
                startTime: data.startTimeStr,
                status: { in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] },
            },
        })

        if (existingBooking) {
            return { success: false, error: "El salón seleccionado ya está reservado para esta fecha y horario." }
        }

        // 1. Crear o actualizar el cliente
        let customer = await prisma.customer.findUnique({ where: { dni: data.customerDni } })

        if (!customer) {
            customer = await prisma.customer.create({
                data: {
                    dni: data.customerDni,
                    fullName: data.customerName,
                    phone: data.customerPhone,
                    email: data.customerEmail || `${data.customerDni}@pokido.temp`,
                },
            })
        } else if (data.customerEmail && customer.email !== data.customerEmail) {
            customer = await prisma.customer.update({
                where: { id: customer.id },
                data: { email: data.customerEmail, phone: data.customerPhone },
            })
        }

        // 2. Crear reserva en PENDING
        const rawBooking = await prisma.booking.create({
            data: {
                roomId: data.roomId,
                customerId: customer.id,
                birthdayChild: data.birthdayChild,
                childAge: data.childAge,
                guestCount: data.guestCount,
                date: bookingDate,
                startTime: data.startTimeStr,
                endTime: data.endTimeStr,
                status: BookingStatus.PENDING,
                totalPrice: data.totalPrice,
                depositPaid: 0,
            },
        })

        // 3. Crear Orden de Venta vinculada
        const count = await prisma.order.count()
        const orderNumber = `CUMPLE-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`

        const room = await prisma.partyRoom.findUnique({ where: { id: data.roomId } })

        const order = await prisma.order.create({
            data: {
                orderNumber,
                channel: SalesChannel.WEB,
                customerId: customer.id,
                bookingId: rawBooking.id,
                subtotal: data.totalPrice,
                total: data.totalPrice,
                status: OrderStatus.PENDING,
                items: {
                    create: {
                        description: `Seña Fiesta - ${room?.name || "Salón"} (${data.birthdayChild})`,
                        quantity: 1,
                        unitPrice: data.totalPrice,
                        total: data.totalPrice,
                    },
                },
            },
        })

        // 4. GENERAR PREFERENCIA EN MERCADO PAGO
        const mpResult = await createMercadoPagoPreference(order.id)

        // 🔑 ROLLBACK EN CASO DE ERROR DE MERCADO PAGO
        if (!mpResult.success) {
            await prisma.booking.update({
                where: { id: rawBooking.id },
                data: { status: BookingStatus.CANCELLED },
            })

            await prisma.order.update({
                where: { id: order.id },
                data: { status: OrderStatus.CANCELLED },
            })

            return { success: false, error: mpResult.error }
        }

        revalidatePath("/dashboard/parties")

        return {
            success: true,
            initPoint: mpResult.initPoint,
            preferenceId: mpResult.preferenceId,
            booking: sanitizeBooking(rawBooking),
        }
    } catch (error: any) {
        console.error("Error al crear reserva online de cumpleaños:", error)
        return { success: false, error: error.message }
    }
}

export interface PartyRoomInput {
    id?: string
    name: string
    capacity: number
    recommendedFor?: string
    description?: string
    imageUrl?: string
    includes?: string[]
    isActive?: boolean
    price?: number
    basePrice?: number
    minGuests?: number
    extraGuestPrice?: number
    depositRequired?: boolean
}

// Obtener la lista de salones, reservas de cumpleaños de hoy Y los niños activos en parque
export async function getPartyRoomsData() {
    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        // 1. Obtener salones con reservas de cumpleaños para HOY
        const rawRooms = await prisma.partyRoom.findMany({
            where: {
                isActive: true,
            },
            include: {
                bookings: {
                    where: {
                        status: { in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS, BookingStatus.PENDING] },
                        date: {
                            gte: today,
                            lt: tomorrow,
                        },
                    },
                    include: {
                        customer: true,
                    },
                    orderBy: { startTime: "asc" },
                },
            },
        })

        // 🔑 Sanitizamos tanto la sala como sus reservas
        const rooms = rawRooms.map((room) => ({
            ...sanitizeRoom(room),
            bookings: room.bookings.map((b) => sanitizeBooking(b)),
        }))

        // 2. Contar niños activos DENTRO DEL PARQUE
        const now = new Date()

        const activeChildrenInPark = await prisma.ticket.count({
            where: {
                status: "IN_USE",
                startTime: { lte: now },
                endTime: { gte: now },
            },
        })

        return {
            success: true,
            rooms,
            activeChildrenInPark,
        }
    } catch (error: any) {
        console.error("Error al obtener salones de cumpleaños:", error)
        return { success: false, error: error.message }
    }
}

export interface CreatePartyBookingInput {
    roomId: string
    customerDni: string
    customerName: string
    customerPhone: string
    birthdayChild: string
    childAge: number
    guestCount: number
    dateStr: string
    startTimeStr: string
    endTimeStr: string
    totalPrice?: number
}

// Crear reserva de cumpleaños presencial / POS vinculada al modelo Booking
export async function createPartyBooking(data: CreatePartyBookingInput) {
    try {
        let customer = await prisma.customer.findUnique({
            where: { dni: data.customerDni },
        })

        if (!customer) {
            customer = await prisma.customer.create({
                data: {
                    dni: data.customerDni,
                    fullName: data.customerName,
                    phone: data.customerPhone,
                    email: `${data.customerDni}@pokido.temp`,
                },
            })
        }

        const [year, month, day] = data.dateStr.split("-").map(Number)
        const bookingDate = new Date(year, month - 1, day, 0, 0, 0)

        const rawBooking = await prisma.booking.create({
            data: {
                roomId: data.roomId,
                customerId: customer.id,
                birthdayChild: data.birthdayChild,
                childAge: data.childAge,
                guestCount: data.guestCount,
                date: bookingDate,
                startTime: data.startTimeStr,
                endTime: data.endTimeStr,
                status: BookingStatus.CONFIRMED,
                totalPrice: data.totalPrice || 0,
                depositPaid: data.totalPrice || 0,
            },
        })

        revalidatePath("/dashboard/parties")
        revalidatePath("/dashboard")
        revalidatePath("/dashboard/pos")
        revalidatePath("/dashboard/access")

        return { success: true, booking: sanitizeBooking(rawBooking) }
    } catch (error: any) {
        console.error("Error al crear reserva de cumpleaños:", error)
        return { success: false, error: error.message }
    }
}

// Obtener todos los salones para el panel de configuración
export async function getAllPartyRooms() {
    try {
        const rooms = await prisma.partyRoom.findMany({
            orderBy: { name: "asc" },
        })

        // 🔑 Sanitizamos los salones para convertir Decimal a number
        const sanitizedRooms = rooms.map((room) => sanitizeRoom(room))

        return { success: true, rooms: sanitizedRooms }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function upsertPartyRoom(data: PartyRoomInput) {
    try {
        const payload = {
            name: data.name,
            capacity: Number(data.capacity) || 30,
            basePrice: data.basePrice !== undefined ? Number(data.basePrice) : 35000,
            minGuests: data.minGuests !== undefined ? Number(data.minGuests) : 10,
            extraGuestPrice: data.extraGuestPrice !== undefined ? Number(data.extraGuestPrice) : 3000,
            depositRequired: data.depositRequired !== undefined ? Boolean(data.depositRequired) : true,
            description: data.description || "",
            imageUrl: data.imageUrl || "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&auto=format&fit=crop&q=80",
            recommendedFor: data.recommendedFor || "Grupos generales",
            includes: Array.isArray(data.includes) ? data.includes : [],
        }

        let room
        if (data.id && data.id.trim() !== "") {
            room = await prisma.partyRoom.update({
                where: { id: data.id },
                data: payload,
            })
        } else {
            room = await prisma.partyRoom.create({
                data: {
                    ...payload,
                    isActive: true,
                },
            })
        }

        revalidatePath("/dashboard/parties")
        revalidatePath("/dashboard/settings")

        return { success: true, room: sanitizeRoom(room) }
    } catch (error: any) {
        console.error("Error en upsertPartyRoom:", error)
        return { success: false, error: error.message || "Error al guardar el salón." }
    }
}

export async function getMonthlyBookings(year: number, month: number) {
    try {
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0, 23, 59, 59)

        const bookings = await prisma.booking.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                customer: true,
                room: true,
            },
            orderBy: [
                { date: "asc" },
                { startTime: "asc" },
            ],
        })

        const formattedBookings = bookings.map((b) => ({
            id: b.id,
            birthdayChild: b.birthdayChild || "Festejado",
            childAge: b.childAge || 0,
            guestCount: b.guestCount,
            dateStr: new Date(b.date).toISOString().split("T")[0],
            startTime: b.startTime,
            endTime: b.endTime,
            status: b.status,
            roomName: b.room?.name || "Salón sin asignar",
            roomId: b.roomId,
            customerName: b.customer?.fullName || "Sin tutor",
            customerPhone: b.customer?.phone || "",
            customerDni: b.customer?.dni || "",
            totalPrice: Number(b.totalPrice || 0),
            depositPaid: Number(b.depositPaid || 0),
        }))

        return { success: true, bookings: formattedBookings }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}