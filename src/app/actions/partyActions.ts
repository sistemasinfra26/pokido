"use server"

import { prisma } from "@/lib/prisma"
import { BookingStatus, WristbandStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"

export interface PartyRoomInput {
    id?: string
    name: string
    capacity: number
    recommendedFor?: string
    description?: string
    imageUrl?: string
    includes?: string[]
    isActive?: boolean
}

// Helper para convertir instancias de Decimal y Dates a tipos primitivos seguros
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

        // Sanitizamos los Decimal dentro de las reservas de cada salón
        const rooms = rawRooms.map((room) => ({
            ...room,
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

// Crear reserva de cumpleaños vinculada al modelo Booking
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

        // 🔑 Sanitizado antes de retornar al Client Component
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
        return { success: true, rooms }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// Crear o Actualizar un Salón de Cumpleaños sin errores de tipos en Prisma
export async function upsertPartyRoom(data: PartyRoomInput) {
    try {
        const payload = {
            name: data.name,
            capacity: data.capacity,
            description: data.description || "",
            imageUrl: data.imageUrl || "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&auto=format&fit=crop&q=80",
            recommendedFor: data.recommendedFor || "Grupos generales",
            includes: data.includes || [],
        }

        let room
        if (data.id) {
            // 🔑 CORRECCIÓN: Agregamos ".partyRoom" antes de ".update"
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

        return { success: true, room }
    } catch (error: any) {
        return { success: false, error: error.message }
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