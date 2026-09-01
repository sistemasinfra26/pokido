"use server"

import { prisma } from "@/lib/prisma"
import { PaymentMethod, WristbandStatus, TicketStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"

export interface CartItemInput {
    minorName: string
    minorAge: number
    ticketTypeId: string
    durationMinutes: number
    price: number
    wristbandCode: string
    entryTime?: string // Recibe el horario oficial del turno reservado (ej. "19:30")
}

export interface CreatePosOrderInput {
    customerId: string
    staffProfileId?: string
    cashShiftId?: string
    paymentMethod: PaymentMethod
    items: CartItemInput[]
}

export async function processPosSale(data: CreatePosOrderInput) {
    try {
        const { customerId, staffProfileId, cashShiftId, paymentMethod, items } = data

        if (!items || items.length === 0) {
            return { success: false, error: "El carrito no contiene productos." }
        }

        // Calcular montos de la transacción
        const totalAmount = items.reduce((acc, curr) => acc + curr.price, 0)
        const orderNumber = `ORD-${Date.now().toString().slice(-6)}`

        // Ejecutar la transacción completa
        const result = await prisma.$transaction(async (tx) => {

            // 1. OBTENER O CREAR UN PROFILE (STAFF) VÁLIDO
            let validStaffId = staffProfileId

            if (validStaffId) {
                const existingProfile = await tx.profile.findUnique({
                    where: { id: validStaffId },
                })
                if (!existingProfile) validStaffId = undefined
            }

            if (!validStaffId) {
                const firstProfile = await tx.profile.findFirst()
                if (firstProfile) {
                    validStaffId = firstProfile.id
                } else {
                    // Si no hay ningún perfil registrado en BD, creamos uno de caja por defecto
                    const defaultProfile = await tx.profile.create({
                        data: {
                            fullName: "Cajero Principal",
                            email: "caja.principal@pokidopark.com",
                            role: "CASHIER",
                        },
                    })
                    validStaffId = defaultProfile.id
                }
            }

            // 2. CREAR LA ORDEN PRINCIPAL
            const order = await tx.order.create({
                data: {
                    orderNumber,
                    customerId,
                    staffId: validStaffId,
                    shiftId: cashShiftId,
                    subtotal: totalAmount,
                    total: totalAmount,
                    status: "COMPLETED",
                },
            })

            // 3. PROCESAR CADA NIÑO, PASE Y PULSERA ALINEADO AL TURNO
            for (const item of items) {

                // A. Obtener o crear el tipo de pase (TicketType)
                let ticketType = await tx.ticketType.findFirst({
                    where: { durationMinutes: item.durationMinutes },
                })

                if (!ticketType) {
                    ticketType = await tx.ticketType.create({
                        data: {
                            name: `Pase ${item.durationMinutes} Minutos`,
                            durationMinutes: item.durationMinutes,
                            price: item.price,
                        },
                    })
                }

                // B. Buscar o registrar al menor (Minor)
                let minor = await tx.minor.findFirst({
                    where: {
                        customerId,
                        fullName: item.minorName,
                    },
                })

                if (!minor) {
                    const birthDate = new Date()
                    birthDate.setFullYear(birthDate.getFullYear() - item.minorAge)

                    minor = await tx.minor.create({
                        data: {
                            customerId,
                            fullName: item.minorName,
                            birthDate,
                        },
                    })
                }

                // C. Crear el ítem de la orden (OrderItem)
                await tx.orderItem.create({
                    data: {
                        orderId: order.id,
                        ticketTypeId: ticketType.id,
                        description: `Pase ${item.durationMinutes} Min - ${item.minorName}`,
                        quantity: 1,
                        unitPrice: item.price,
                        total: item.price,
                    },
                })

                // D. CALCULAR FECHA/HORA EXACTA DEL TURNO RESERVADO
                const now = new Date()
                let startTime = new Date()

                // Si el ítem del carrito incluye la hora del turno reservado (ej. "19:30")
                if (item.entryTime && item.entryTime.includes(":")) {
                    const [hours, minutes] = item.entryTime.split(":").map(Number)
                    startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0)
                }

                // El fin del turno se calcula sumando la duración exacta contratada a la hora del turno
                const endTime = new Date(startTime.getTime() + item.durationMinutes * 60000)
                const qrCode = `QR-${Date.now()}-${Math.floor(Math.random() * 1000)}`

                // E. Generar el Ticket de tiempo alineado con el turno
                const ticket = await tx.ticket.create({
                    data: {
                        ticketTypeId: ticketType.id,
                        customerId,
                        minorId: minor.id,
                        orderId: order.id,
                        qrCode,
                        price: item.price,
                        validDate: startTime,
                        startTime: startTime, // Guarda la hora oficial del turno (ej: 19:30)
                        endTime: endTime,     // Guarda la hora oficial de salida (ej: 20:30)
                        status: TicketStatus.ACTIVE,
                    },
                })

                // F. Asignar o Vincular la Pulsera Física (Wristband)
                await tx.wristband.upsert({
                    where: { code: item.wristbandCode },
                    update: {
                        ticketId: ticket.id,
                        status: WristbandStatus.IN_PARK,
                        assignedAt: now,
                    },
                    create: {
                        code: item.wristbandCode,
                        color: "Estándar",
                        ticketId: ticket.id,
                        status: WristbandStatus.IN_PARK,
                        assignedAt: now,
                    },
                })
            }

            // 4. REGISTRAR EL PAGO DE LA ORDEN
            await tx.payment.create({
                data: {
                    orderId: order.id,
                    shiftId: cashShiftId,
                    amount: totalAmount,
                    method: paymentMethod,
                    status: "APPROVED",
                },
            })

            return order
        })

        revalidatePath("/dashboard/access")
        revalidatePath("/dashboard")

        return { success: true, orderId: result.id, orderNumber: result.orderNumber }
    } catch (error: any) {
        console.error("Error al procesar venta POS:", error)
        return { success: false, error: error.message || "Error al procesar la venta." }
    }
}